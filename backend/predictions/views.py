import pystac
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
from fair.stac.validators import batch_runtime, validate_inference_params
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.permissions import (
    IsOwnerOrAdmin,
    IsOwnerOrAdminOrReadOnly,
    PublishedReadOrAuthenticatedWrite,
    is_admin,
)
from shared.enums import Visibility
from shared.integrations.stac import (
    BASE_MODELS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
    get_item,
    item_exists,
)
from shared.public_urls import require_public_url
from shared.run_endpoints import stop_pipeline_run
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


@extend_schema_view(
    list=extend_schema(description="List predictions visible to the caller."),
    retrieve=extend_schema(description="Retrieve one prediction by id."),
    submit=extend_schema(description="Enqueue an inference ZenML pipeline run."),
    run_cancel=extend_schema(description="Stop a running inference pipeline."),
    publish=extend_schema(description="Mark the prediction as public-readable (owner/admin)."),
    unpublish=extend_schema(description="Revoke public-read access (owner/admin)."),
    result=extend_schema(description="Presigned URLs for the materialized geojson/fgb/pmtiles."),
)
class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    permission_classes = [PublishedReadOrAuthenticatedWrite, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["local_model_stac_id", "user", "status", "visibility"]
    search_fields = ["description"]
    ordering_fields = ["submitted_at", "last_polled_at"]
    throttle_scope = "prediction_submit"

    def get_queryset(self):
        qs = Prediction.objects.with_model_details().select_related("user")
        user = self.request.user
        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)
        if is_admin(user):
            return qs
        return qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))

    def get_permissions(self):
        if self.action in {"publish", "unpublish", "submit", "run_cancel"}:
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
                            "https://tiles.imagery.hotosm.org/raster/collections/openaerialmap/items/"
                            "62d86c65d8499800053796c4/tiles/WebMercatorQuad/{z}/{x}/{y}?assets=visual"
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
                        "https://tiles.imagery.hotosm.org/raster/collections/openaerialmap/items/"
                        "62d86c65d8499800053796c4/tiles/WebMercatorQuad/{z}/{x}/{y}?assets=visual"
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
        if batch_runtime(model_item.assets) is None:
            raise ValidationError(
                {
                    "model_stac_id": [
                        f"'{model_stac_id}' has no batch runtime, so it serves try-now only."
                    ]
                }
            )
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
            description=payload["description"],
            user=request.user,
        )
        submit_prediction.enqueue(prediction_id=prediction.id)
        created = Prediction.objects.with_model_details().get(pk=prediction.pk)
        return Response(PredictionSerializer(created).data, status=status.HTTP_202_ACCEPTED)

    def _run_for_caller(self, run_id: str) -> Prediction:
        prediction = get_object_or_404(Prediction, zenml_run_id=run_id)
        user = self.request.user
        if not is_admin(user) and prediction.user_id != user.osm_id:
            raise PermissionDenied("Not allowed.")
        return prediction

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
        prediction = self.get_object()
        prediction.visibility = Visibility.PUBLIC
        prediction.save(update_fields=["visibility"])
        return Response(PredictionSerializer(prediction).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        prediction = self.get_object()
        prediction.visibility = Visibility.PRIVATE
        prediction.save(update_fields=["visibility"])
        return Response(PredictionSerializer(prediction).data)

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


def _presigned_result_urls(prediction: Prediction) -> dict[str, str]:
    return {
        "geojson": presigned_get_url(StoragePaths.prediction_geojson_key(prediction.id)),
        "fgb": presigned_get_url(StoragePaths.prediction_fgb_key(prediction.id)),
        "pmtiles": presigned_get_url(StoragePaths.prediction_pmtiles_key(prediction.id)),
    }
