from django.conf import settings
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import filters, serializers, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.authentication import OsmAuthentication
from accounts.permissions import IsOwnerOrAdminOrReadOnly, _is_admin
from shared.integrations.stac import LOCAL_MODELS_COLLECTION, item_exists
from shared.integrations.zenml import (
    fetch_run_logs,
    fetch_step_logs,
    get_run_status,
    is_terminal,
)
from shared.storage import StoragePaths, presigned_get_url
from trainings.serializers import LogEntrySerializer, RunStatusSerializer

from .models import Prediction
from .serializers import (
    PredictionResultSerializer,
    PredictionSerializer,
    PredictionSubmitSerializer,
)
from .tasks import submit_prediction


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
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["local_model_stac_id", "user", "status", "is_public"]
    ordering_fields = ["submitted_at", "last_polled_at"]
    throttle_scope = "prediction_submit"

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

        if not item_exists(LOCAL_MODELS_COLLECTION, payload["model_stac_id"]):
            raise NotFound(
                f"model_stac_id '{payload['model_stac_id']}' "
                "not found in STAC local-models collection."
            )

        prediction = Prediction.objects.create(
            local_model_stac_id=payload["model_stac_id"],
            image_uri=payload["image_uri"],
            bbox=payload["bbox"],
            zoom=payload["zoom"],
            params=payload["params"],
            remove_osm=payload["remove_osm"],
            description=payload["description"],
            user=request.user,
        )
        submit_prediction.enqueue(prediction_id=prediction.id)
        return Response(PredictionSerializer(prediction).data, status=status.HTTP_202_ACCEPTED)

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
        # TODO(prediction-stac):
        # - paired with unpublish below — set S3 ACL to public-read for output files.
        prediction = self.get_object()
        prediction.is_public = True
        prediction.save(update_fields=["is_public"])
        return Response(PredictionSerializer(prediction).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        # TODO(prediction-stac): paired with publish above — flip S3 ACL
        # back to private and deprecate the STAC item (don't delete).
        prediction = self.get_object()
        prediction.is_public = False
        prediction.save(update_fields=["is_public"])
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
            tms_url=str(prediction.image_uri),
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
        from zenml.client import Client
        from zenml.utils.run_utils import stop_run

        prediction = self._run_for_caller(run_id)
        run = Client().get_pipeline_run(run_id)
        graceful = request.query_params.get("graceful", "false").lower() == "true"
        stop_run(run, graceful=graceful)
        Prediction.objects.filter(pk=prediction.pk).update(status="stopping")
        return Response({"run_id": run_id, "status": "stopping", "graceful": graceful})

    @extend_schema(responses=LogEntrySerializer(many=True))
    @action(detail=False, methods=["get"], url_path=r"runs/(?P<run_id>[^/]+)/logs")
    def run_logs(self, request, run_id: str) -> Response:
        self._run_for_caller(run_id)
        tail = int(request.query_params.get("tail", 1000))
        step = request.query_params.get("step")
        if step:
            entries = fetch_step_logs(run_id, step, tail=tail)
        else:
            entries = fetch_run_logs(run_id, tail=tail)
        data = [{"level": e.level, "message": e.message, "timestamp": e.timestamp} for e in entries]
        return Response(LogEntrySerializer(data, many=True).data)


@extend_schema(tags=["public-predictions"])
class PublicPredictionRetrieveView(views.APIView):
    """Anonymous read-only access to predictions whose owner ran `publish`."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    serializer_class = PredictionSerializer

    @extend_schema(responses=PredictionSerializer)
    def get(self, request, pk: int) -> Response:
        prediction = get_object_or_404(Prediction, pk=pk, is_public=True)
        return Response(PredictionSerializer(prediction).data)


@extend_schema(tags=["public-predictions"])
class PublicPredictionResultView(views.APIView):
    """Presigned URLs for a published prediction's output formats."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    serializer_class = PredictionResultSerializer

    @extend_schema(responses={200: PredictionResultSerializer, 409: None})
    def get(self, request, pk: int) -> Response:
        prediction = get_object_or_404(Prediction, pk=pk, is_public=True)
        if not prediction.results_ready:
            return Response(
                {"detail": "Result not ready; wait for post-run to finish."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(PredictionResultSerializer(_presigned_result_urls(prediction)).data)


def _presigned_result_urls(prediction: Prediction) -> dict[str, str]:
    return {
        "geojson": presigned_get_url(StoragePaths.prediction_geojson_key(prediction.id)),
        "fgb": presigned_get_url(StoragePaths.prediction_fgb_key(prediction.id)),
        "pmtiles": presigned_get_url(StoragePaths.prediction_pmtiles_key(prediction.id)),
    }
