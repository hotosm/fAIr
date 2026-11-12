from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_gis.filters import InBBoxFilter

from accounts.permissions import IsOwnerOrAdminOrReadOnly, is_admin
from modelregistry.models import BaseModel, LocalModel

from .models import Feedback
from .serializers import FeedbackSerializer

_CREATE_EXAMPLE = OpenApiExample(
    "Accept a predicted tree",
    value={
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-13.298, 8.494]},
        "properties": {
            "stac_id": "unet-tree-segmentation",
            "action": "accept",
            "comments": "",
            "config": {},
        },
    },
    request_only=True,
)
_PATCH_EXAMPLE = OpenApiExample(
    "Change the mark to reject",
    value={"properties": {"action": "reject"}},
    request_only=True,
)


@extend_schema_view(
    list=extend_schema(
        description="List the caller's feedback and feedback on their models (admins see all)."
    ),
    create=extend_schema(
        description="Submit accept/reject feedback on a predicted feature.",
        examples=[_CREATE_EXAMPLE],
    ),
    retrieve=extend_schema(description="Retrieve one feedback entry by id."),
    update=extend_schema(description="Replace a feedback entry (author or admin only)."),
    partial_update=extend_schema(
        description="Patch a feedback entry (author or admin only).", examples=[_PATCH_EXAMPLE]
    ),
    destroy=extend_schema(description="Delete a feedback entry (author or admin only)."),
)
class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, InBBoxFilter]
    filterset_fields = ["stac_id", "action", "user"]
    bbox_filter_field = "geom"

    def get_queryset(self):
        user = self.request.user
        queryset = Feedback.objects.select_related("user")
        if is_admin(user):
            return queryset
        return queryset.filter(
            Q(user=user)
            | Q(stac_id__in=BaseModel.objects.filter(user=user).values("stac_item_id"))
            | Q(stac_id__in=LocalModel.objects.filter(user=user).values("stac_item_id"))
        )

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)
