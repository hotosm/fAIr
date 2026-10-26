import pystac
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiExample,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from fair.stac.inputs import require_imagery_for_inputs
from fair.stac.validators import validate_inference_params
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.authentication import OsmAuthentication
from accounts.permissions import (
    IsOwnerOrAdmin,
    IsOwnerOrAdminOrReadOnly,
    PublishedReadOrAuthenticatedWrite,
    _is_admin,
)
from shared.enums import Visibility
from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
    get_item,
    item_exists,
)
from shared.integrations.zenml import (
    get_run_status,
    is_terminal,
)
from shared.public_urls import require_public_url
from shared.run_endpoints import read_run_logs, stop_pipeline_run
from shared.serializers import LogEntrySerializer, RunLogsQuerySerializer, RunStatusSerializer
from shared.storage import StoragePaths, presigned_get_url

from .models import Prediction
from .serializers import (
    PredictionResultSerializer,
    PredictionSerializer,
    PredictionSubmitSerializer,
)
from .tasks import submit_prediction


def _require_public_url_params(params: dict, model_item: pystac.Item) -> None:
    """The backend treats free-form `str` params (`values` unset) as URLs the model fetches, such
    as a footprints GeoJSON, and requires each non-empty one to be a public http or https URL."""
    spec_entries = model_item.properties.get("fair:hyperparameters_spec", [])
    spec = {entry["key"]: entry for entry in spec_entries}
    for key, value in params.items():
        entry = spec[key]
        if entry.get("type") == "str" and not entry.get("values") and value:
            require_public_url(value, ("http", "https"))


class _MapswipeProjectSerializer(serializers.Serializer):
    """Inline body schema for the create-mapswipe-project action."""

    topic = serializers.CharField(max_length=200)
    region = serializers.CharField(max_length=200)
    description = serializers.CharField()
    instruction = serializers.CharField()
    look_for = serializers.CharField(max_length=200)
    project_number = serializers.IntegerField(min_value=1)
    organization_id = serializers.CharField(required=False)
    tutorial_id = serializers.CharField(required=False)
    group_size = serializers.IntegerField(required=False, default=25, min_value=1)
    verification_number = serializers.IntegerField(required=False)

    def validate(self, attrs):
        attrs.setdefault("organization_id", str(settings.MAPSWIPE_ORGANIZATION_ID))
        attrs.setdefault("tutorial_id", settings.MAPSWIPE_TUTORIAL_ID)
        attrs.setdefault("verification_number", settings.MAPSWIPE_VERIFICATION_NUMBER)
        return attrs


@extend_schema_view(
    list=extend_schema(description="List predictions visible to the caller."),
    retrieve=extend_schema(description="Retrieve one prediction by id."),
    submit=extend_schema(description="Enqueue an inference ZenML pipeline run."),
    run_status=extend_schema(description="Poll the live ZenML run status; updates status."),
    run_logs=extend_schema(
        description="Tail run logs (run-level by default, step-level with ?step=)."
    ),
    run_cancel=extend_schema(description="Stop a running inference pipeline."),
    publish=extend_schema(description="Mark the prediction as public-readable (owner/admin)."),
    unpublish=extend_schema(description="Revoke public-read access (owner/admin)."),
    result=extend_schema(description="Presigned URLs for the materialized geojson/fgb/pmtiles."),
    mapswipe=extend_schema(
        description="Create a Mapswipe validation project from this prediction."
    ),
)
class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [PublishedReadOrAuthenticatedWrite, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["local_model_stac_id", "user", "status", "visibility"]
    search_fields = ["description"]
    ordering_fields = ["submitted_at", "last_polled_at"]
    throttle_scope = "prediction_submit"

    def get_queryset(self):
        qs = Prediction.objects.with_category().select_related("user")
        user = self.request.user
        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)
        if _is_admin(user):
            return qs
        return qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))

    def get_permissions(self):
        if self.action in {"run_status", "run_logs"}:
            return [IsAuthenticated()]
        if self.action in {"publish", "unpublish", "submit", "mapswipe", "run_cancel"}:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()

    @extend_schema(
        request=PredictionSubmitSerializer,
        examples=[
            OpenApiExample(
                "Submit with bbox",
                value={
                    "model_stac_id": "0311d82d-0f8e-4021-adc5-bb4d6b81a1d4",
                    "imagery": {
                        "image": (
                            "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/"
                            "62d85d11d8499800053796c2/{z}/{x}/{y}"
                        )
                    },
                    "bbox": [85.51678, 27.63133, 85.52323, 27.63743],
                    "zoom": 19,
                    "params": {"confidence_threshold": 0.25},
                },
                request_only=True,
            ),
            OpenApiExample(
                "Submit to a model with post and pre inputs",
                value={
                    "model_stac_id": "dinov3-damage",
                    "imagery": {
                        "post": "https://tiles.example.org/post-event/{z}/{x}/{y}",
                        "pre": "https://tiles.example.org/pre-event/{z}/{x}/{y}",
                    },
                    "bbox": [85.37, 28.26, 85.38, 28.27],
                    "zoom": 18,
                    "params": {"confidence_threshold": 0.0},
                },
                request_only=True,
            ),
            OpenApiExample(
                "Submit with geometry",
                value={
                    "model_stac_id": "0311d82d-0f8e-4021-adc5-bb4d6b81a1d4",
                    "image_uri": (
                        "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/"
                        "62d85d11d8499800053796c2/{z}/{x}/{y}"
                    ),
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [85.51678, 27.63133],
                                [85.52323, 27.63133],
                                [85.52323, 27.63743],
                                [85.51678, 27.63743],
                                [85.51678, 27.63133],
                            ]
                        ],
                    },
                    "zoom": 19,
                    "params": {"confidence_threshold": 0.25},
                },
                request_only=True,
            ),
        ],
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="submit",
        throttle_classes=[ScopedRateThrottle],
    )
    def submit(self, request) -> Response:
        serializer = PredictionSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        model_stac_id = payload["model_stac_id"]
        collection = next(
            (
                collection
                for collection in (LOCAL_MODELS_COLLECTION, BASE_MODELS_COLLECTION)
                if item_exists(collection, model_stac_id)
            ),
            None,
        )
        if collection is None:
            raise NotFound(
                f"model_stac_id '{model_stac_id}' not found in "
                "local-models or base-models collections."
            )
        model_item = get_item(collection, model_stac_id)
        try:
            input_names = require_imagery_for_inputs(model_item, payload["imagery"])
        except ValueError as exc:
            raise ValidationError({"imagery": [str(exc)]}) from exc
        if payload["params"]:
            try:
                validate_inference_params(payload["params"], model_item)
                _require_public_url_params(payload["params"], model_item)
            except ValueError as exc:
                raise ValidationError({"params": [str(exc)]}) from exc

        prediction = Prediction.objects.create(
            local_model_stac_id=payload["model_stac_id"],
            imagery=payload["imagery"],
            primary_input=input_names[0],
            geometry=payload["geometry"],
            zoom=payload["zoom"],
            params=payload["params"],
            remove_osm=payload["remove_osm"],
            description=payload["description"],
            user=request.user,
        )
        submit_prediction.enqueue(prediction_id=prediction.id)
        created = Prediction.objects.with_category().get(pk=prediction.pk)
        return Response(PredictionSerializer(created).data, status=status.HTTP_202_ACCEPTED)

    def _run_for_caller(self, run_id: str) -> Prediction:
        prediction = get_object_or_404(Prediction, zenml_run_id=run_id)
        user = self.request.user
        if not _is_admin(user) and prediction.user_id != user.osm_id:
            raise PermissionDenied("Not allowed.")
        return prediction

    @extend_schema(responses=RunStatusSerializer)
    @action(detail=False, methods=["get"], url_path=r"runs/(?P<run_id>[^/]+)/status")
    def run_status(self, request, run_id: str) -> Response:
        prediction = self._run_for_caller(run_id)
        run_status = get_run_status(run_id)
        Prediction.objects.filter(pk=prediction.pk).update(status=run_status)
        return Response(
            RunStatusSerializer(
                {"run_id": run_id, "status": run_status, "is_terminal": is_terminal(run_status)}
            ).data
        )

    @action(detail=True, methods=["get"], url_path="result")
    def result(self, request, pk: int | None = None) -> Response:
        """Return presigned URLs for each materialized output (geojson/fgb/pmtiles).

        FGB is the streaming-friendly format: clients (FlatGeobuf.js) can range-
        query by bbox without proxying through this service. PMTiles is for
        vector-tile rendering. GeoJSON is the canonical form.
        """
        prediction = self.get_object()
        if not prediction.results_ready:
            return Response(
                {"detail": "Result not ready; wait for post-run to finish."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(PredictionResultSerializer(_presigned_result_urls(prediction)).data)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk: int | None = None) -> Response:
        # TODO(prediction-stac): also flip S3 ACL on output files to public-read.
        prediction = self.get_object()
        prediction.visibility = Visibility.PUBLIC
        prediction.save(update_fields=["visibility"])
        return Response(PredictionSerializer(prediction).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        # TODO(prediction-stac): also flip S3 ACL back to private and deprecate the STAC item.
        prediction = self.get_object()
        prediction.visibility = Visibility.PRIVATE
        prediction.save(update_fields=["visibility"])
        return Response(PredictionSerializer(prediction).data)

    @action(detail=True, methods=["post"], url_path="mapswipe")
    def mapswipe(self, request, pk: int | None = None) -> Response:
        from shared.integrations.mapswipe import MapswipeClient

        prediction = self.get_object()
        if not settings.ENABLE_MAPSWIPE:
            return Response(
                {"detail": "Mapswipe integration is disabled (ENABLE_MAPSWIPE=false)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not prediction.results_ready:
            return Response(
                {"detail": "Result not ready; wait for post-run to finish."},
                status=status.HTTP_409_CONFLICT,
            )

        body = _MapswipeProjectSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        params = body.validated_data

        geojson_url = presigned_get_url(StoragePaths.prediction_geojson_key(prediction.id))
        client = MapswipeClient(
            backend_url=settings.MAPSWIPE_BACKEND_URL,
            manager_url=settings.MAPSWIPE_MANAGER_URL,
            fb_auth_url=settings.MAPSWIPE_FB_AUTH_URL,
            fb_username=settings.MAPSWIPE_FB_USERNAME,
            fb_password=settings.MAPSWIPE_FB_PASSWORD,
            csrftoken_key=settings.MAPSWIPE_CSRFTOKEN_KEY,
        )
        project_id, image_asset_id = client.create_validation_project(
            topic=params["topic"],
            region=params["region"],
            description=params["description"],
            instruction=params["instruction"],
            look_for=params["look_for"],
            project_number=params["project_number"],
            organization_id=params["organization_id"],
        )
        client.update_project(
            project_id=project_id,
            geojson_url=geojson_url,
            tms_url=prediction.primary_imagery,
            image_asset_id=image_asset_id,
            group_size=params["group_size"],
            verification_number=params["verification_number"],
            tutorial_id=params["tutorial_id"],
        )
        prediction.mapswipe_project_id = project_id
        prediction.save(update_fields=["mapswipe_project_id"])
        return Response(
            {"prediction_id": prediction.id, "mapswipe_project_id": project_id},
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        request=None,
        responses=inline_serializer(
            name="PredictionRunCancelResponse",
            fields={
                "run_id": serializers.CharField(),
                "status": serializers.CharField(),
                "graceful": serializers.BooleanField(),
            },
        ),
    )
    @action(detail=False, methods=["post"], url_path=r"runs/(?P<run_id>[^/]+)/cancel")
    def run_cancel(self, request, run_id: str) -> Response:
        prediction = self._run_for_caller(run_id)
        graceful = request.query_params.get("graceful", "false").lower() == "true"
        stop_pipeline_run(run_id, graceful=graceful)
        Prediction.objects.filter(pk=prediction.pk).update(status="stopping")
        return Response({"run_id": run_id, "status": "stopping", "graceful": graceful})

    @extend_schema(parameters=[RunLogsQuerySerializer], responses=LogEntrySerializer(many=True))
    @action(
        detail=False,
        methods=["get"],
        url_path=r"runs/(?P<run_id>[^/]+)/logs",
        filter_backends=[],
        pagination_class=None,
    )
    def run_logs(self, request, run_id: str) -> Response:
        self._run_for_caller(run_id)
        return Response(read_run_logs(run_id, request.query_params))


def _presigned_result_urls(prediction: Prediction) -> dict[str, str]:
    return {
        "geojson": presigned_get_url(StoragePaths.prediction_geojson_key(prediction.id)),
        "fgb": presigned_get_url(StoragePaths.prediction_fgb_key(prediction.id)),
        "pmtiles": presigned_get_url(StoragePaths.prediction_pmtiles_key(prediction.id)),
    }


@extend_schema_view(
    list=extend_schema(
        tags=["public-predictions"],
        description="List published (public) predictions. No authentication required.",
    ),
    retrieve=extend_schema(
        tags=["public-predictions"],
        description="Retrieve one published (public) prediction. No authentication required.",
    ),
)
class PublicPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Prediction.objects.with_category()
        .select_related("user")
        .filter(visibility=Visibility.PUBLIC)
    )
    serializer_class = PredictionSerializer
    authentication_classes: list = []
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["local_model_stac_id"]
    search_fields = ["description"]
    ordering_fields = ["submitted_at"]
