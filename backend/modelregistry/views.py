from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import OsmAuthentication
from accounts.permissions import (
    IsAdmin,
    IsOwnerOrAdmin,
    PublishedReadOrAuthenticatedWrite,
    _is_admin,
)
from shared.enums import Visibility
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
    permission_classes = [PublishedReadOrAuthenticatedWrite]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "visibility", "user"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "last_modified"]

    def get_queryset(self):
        qs = LocalModel.objects.all().annotate(run_count=Count("runs"))
        user = self.request.user
        if not user.is_authenticated:
            qs = qs.filter(visibility=Visibility.PUBLIC)
        elif not _is_admin(user):
            qs = qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))
        return annotate_stars(qs, self.request, key_field="name")

    def get_permissions(self):
        if self.action == "pin":
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"publish", "unpublish"}:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()

    @extend_schema(request=None, responses={200: LocalModelSerializer})
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        model.visibility = Visibility.PUBLIC
        model.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @extend_schema(request=None, responses={200: LocalModelSerializer})
    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        model.visibility = Visibility.PRIVATE
        model.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="pin")
    def pin(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        # STAC items are keyed by version UUID; the active version is
        # whichever STAC item has mlm:name == model.name.
        active = get_active_local_model_item(model.name)
        if active is None:
            return Response(
                {
                    "detail": (
                        f"Model '{model.name}' has no active STAC version. "
                        "Promote at least one training run before pinning."
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
