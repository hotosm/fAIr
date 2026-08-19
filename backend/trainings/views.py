from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiExample,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.authentication import OsmAuthentication
from accounts.permissions import IsOwnerOrAdminOrReadOnly, _is_admin
from datasets.models import Dataset
from modelregistry.models import BaseModel, LocalModel
from shared.integrations.stac import (
    DATASETS_COLLECTION,
    LOCAL_MODELS_COLLECTION,
    get_active_local_model_item,
    invalidate_stac_cache,
    item_exists,
)
from shared.integrations.zenml import (
    fetch_run_logs,
    fetch_step_logs,
    for_user,
    get_run_status,
    is_terminal,
)
from shared.storage import BackendLocalModelPaths

from .models import TrainingRunRef
from .serializers import (
    LogEntrySerializer,
    RunStatusSerializer,
    TrainingPublishSerializer,
    TrainingRunRefSerializer,
    TrainingSubmitSerializer,
)
from .tasks import submit_training


def _previous_version_description(model_name: str) -> str:
    # Echo the active version's description
    item = get_active_local_model_item(model_name)
    if item is None:
        return ""
    return item.properties.get("description") or ""


@extend_schema_view(
    list=extend_schema(description="List training runs visible to the caller."),
    retrieve=extend_schema(description="Retrieve one training run by id."),
    submit=extend_schema(
        description=(
            "Enqueue a finetune ZenML pipeline run. Validates that "
            "`base_model_stac_id` is a registered base model and "
            "`dataset_stac_id` exists in datasets before enqueueing."
        )
    ),
    run_status=extend_schema(description="Poll the live ZenML run status; updates status."),
    run_logs=extend_schema(
        description="Tail run logs (run-level by default, step-level with ?step=)."
    ),
    run_cancel=extend_schema(
        description="Stop a running ZenML pipeline (graceful via ?graceful=true)."
    ),
    publish=extend_schema(
        description=(
            "Publish the finetuned model to local-models (owner only). "
            "Writes a new STAC item under the model's mlm:name and refreshes "
            "the cached entry. Each successful publish creates a new version."
        )
    ),
)
class TrainingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TrainingRunRef.objects.all()
    serializer_class = TrainingRunRefSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["local_model", "user", "status"]
    ordering_fields = ["submitted_at", "last_polled_at"]
    throttle_scope = "training_submit"

    @extend_schema(
        request=TrainingSubmitSerializer,
        examples=[
            OpenApiExample(
                "Submit finetune",
                value={
                    "base_model_stac_id": "unet-segmentation",
                    "dataset_stac_id": "banepa-buildings-1712345678-abcdef",
                    "model_name": "banepa-unet",
                },
                request_only=True,
            )
        ],
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="submit",
        throttle_classes=[ScopedRateThrottle],
    )
    def submit(self, request) -> Response:
        serializer = TrainingSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        base_model = BaseModel.objects.filter(stac_item_id=payload["base_model_stac_id"]).first()
        if base_model is None:
            raise NotFound(
                f"base_model_stac_id '{payload['base_model_stac_id']}' is not a "
                "registered base model. Register it via POST /api/v1/base-models/ "
                "before training."
            )
        if not item_exists(DATASETS_COLLECTION, payload["dataset_stac_id"]):
            raise NotFound(
                f"dataset_stac_id '{payload['dataset_stac_id']}' "
                "not found in STAC datasets collection."
            )
        # The local Dataset row is also required (we manage its lifecycle).
        dataset = get_object_or_404(
            Dataset,
            stac_id=payload["dataset_stac_id"],
            status=Dataset.Status.BUILT,
        )

        # TODO(clone-training): expose POST /api/v1/trainings/{id}/clone/ that
        # copies an existing run's (base_model, dataset, overrides) into a new
        # LocalModel owned by the caller. Removes the need for users to manually
        # re-key configs to retrain on someone else's setup.
        local_model, created = LocalModel.objects.get_or_create(
            name=payload["model_name"],
            defaults={
                "user": request.user,
                "base_model": base_model,
                "category": base_model.category,
            },
        )
        if (
            not created
            and local_model.user_id != request.user.osm_id
            and not _is_admin(request.user)
        ):
            return Response(
                {
                    "detail": (
                        f"Model '{local_model.name}' is owned by another user. "
                        "Submit under a different model_name, or clone an existing "
                        "training run config under your own model."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        run_ref = TrainingRunRef.objects.create(
            zenml_run_id=None,
            local_model=local_model,
            base_model_stac_id=payload["base_model_stac_id"],
            dataset=dataset,
            overrides=payload["overrides"],
            title=payload["title"],
            keywords=payload["keywords"],
            description=payload["description"],
            user=request.user,
        )

        submit_training.enqueue(training_run_ref_id=run_ref.id)
        return Response(TrainingRunRefSerializer(run_ref).data, status=status.HTTP_202_ACCEPTED)

    def _run_for_caller(self, run_id: str) -> TrainingRunRef:
        # ZenML run_ids are UUIDs and the action sits behind detail=False, so
        # IsOwnerOrAdminOrReadOnly never gets a chance to fire on the row that
        # owns this run. Resolve the row by zenml_run_id and gate by ownership
        # explicitly; otherwise any authenticated caller could poll/cancel/log
        # any other user's pipeline run.
        run = get_object_or_404(TrainingRunRef, zenml_run_id=run_id)
        user = self.request.user
        if not _is_admin(user) and run.user_id != user.osm_id:
            raise PermissionDenied("Not allowed.")
        return run

    @extend_schema(responses=RunStatusSerializer)
    @action(detail=False, methods=["get"], url_path=r"runs/(?P<run_id>[^/]+)/status")
    def run_status(self, request, run_id: str) -> Response:
        run = self._run_for_caller(run_id)
        run_status = get_run_status(run_id)
        TrainingRunRef.objects.filter(pk=run.pk).update(status=run_status)
        return Response(
            RunStatusSerializer(
                {"run_id": run_id, "status": run_status, "is_terminal": is_terminal(run_status)}
            ).data
        )

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

    @extend_schema(
        request=None,
        responses=inline_serializer(
            name="TrainingRunCancelResponse",
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

        run_ref = self._run_for_caller(run_id)
        run = Client().get_pipeline_run(run_id)
        graceful = request.query_params.get("graceful", "false").lower() == "true"
        stop_run(run, graceful=graceful)
        TrainingRunRef.objects.filter(pk=run_ref.pk).update(status="stopping")
        return Response({"run_id": run_id, "status": "stopping", "graceful": graceful})

    @extend_schema(
        request=TrainingPublishSerializer,
        responses=inline_serializer(
            name="TrainingPublishResponse",
            fields={"local_model_stac_id": serializers.CharField()},
        ),
        examples=[
            OpenApiExample(
                "Publish trained model",
                value={
                    "title": "Banepa buildings UNet",
                    "description": "Promoted from training run",
                },
                request_only=True,
            )
        ],
    )
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk: int | None = None) -> Response:
        run_ref = self.get_object()
        if run_ref.user_id != request.user.osm_id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if run_ref.status != "completed":
            return Response(
                {"detail": "Training run is not completed."},
                status=status.HTTP_409_CONFLICT,
            )
        if not run_ref.zenml_run_id:
            return Response(
                {"detail": "Training run has no ZenML run id."},
                status=status.HTTP_409_CONFLICT,
            )
        if not run_ref.dataset:
            return Response(
                {"detail": "Training run has no dataset."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = TrainingPublishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        description = (
            serializer.validated_data["description"]
            or run_ref.description
            or _previous_version_description(run_ref.local_model.name)
            or ""
        )
        title = serializer.validated_data["title"] or run_ref.title or None
        keywords = list(run_ref.keywords or []) or None
        client = for_user(str(request.user.osm_id))
        local_id = client.promote(
            run_ref.local_model.name,
            base_model_id=run_ref.base_model_stac_id,
            dataset_id=run_ref.dataset.stac_id,
            description=description,
            title=title,
            keywords=keywords,
            pipeline_run_id=run_ref.zenml_run_id,
            paths=BackendLocalModelPaths,
        )
        run_ref.local_model.status = LocalModel.Status.ACTIVE
        run_ref.local_model.stac_item_id = local_id
        run_ref.local_model.save(update_fields=["status", "stac_item_id", "last_modified"])
        invalidate_stac_cache(LOCAL_MODELS_COLLECTION, run_ref.local_model.name)
        from modelregistry.tasks import mirror_stac_assets_task

        mirror_stac_assets_task.enqueue(collection_id=LOCAL_MODELS_COLLECTION, item_id=local_id)
        return Response({"local_model_stac_id": local_id}, status=status.HTTP_201_CREATED)
