from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import OsmAuthentication
from accounts.permissions import IsAdmin
from shared.integrations.stac import (
    FAIR_PINNED_PROPERTY,
    LOCAL_MODELS_COLLECTION,
    get_active_local_model_item,
    set_item_property,
)
from shared.integrations.zenml import list_runs_for_model
from shared.stars import annotate_stars

from .models import LocalModel
from .serializers import LocalModelSerializer, TrainingRunSummarySerializer


@extend_schema_view(
    list=extend_schema(description="List local (finetuned) models."),
    retrieve=extend_schema(description="Retrieve one local model by id."),
    pin=extend_schema(
        description=(
            "Toggle the `fair:pinned` STAC property on a model (admin only). "
            "Writes to STAC; the DB row is unchanged."
        ),
    ),
    runs=extend_schema(description="List ZenML pipeline runs that produced this model."),
)
class LocalModelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LocalModel.objects.all()
    serializer_class = LocalModelSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "user"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "last_modified"]

    def get_queryset(self):
        qs = LocalModel.objects.all().annotate(run_count=Count("runs"))
        return annotate_stars(qs, self.request, key_field="name")

    def get_permissions(self):
        if self.action == "pin":
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["patch"], url_path="pin")
    def pin(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        # STAC items are keyed by version UUID; resolve the active version
        # by mlm:name == model.name. Pinning a model with no published version
        # yet makes no sense, so 409 in that case.
        active = get_active_local_model_item(model.name)
        if active is None:
            return Response(
                {
                    "detail": (
                        f"Model '{model.name}' has no active published version. "
                        "Publish at least one training run before pinning."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )
        desired = bool(request.data.get("is_pinned", True))
        set_item_property(LOCAL_MODELS_COLLECTION, active.id, FAIR_PINNED_PROPERTY, desired)
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="runs")
    def runs(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        limit = int(request.query_params.get("limit", 50))
        summaries = list_runs_for_model(model.name, limit=limit)
        data = [
            {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "created_at": s.created_at,
                "pipeline_name": s.pipeline_name,
                "model_name": s.model_name,
                "model_version": s.model_version,
            }
            for s in summaries
        ]
        return Response(TrainingRunSummarySerializer(data, many=True).data)
