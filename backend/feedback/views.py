from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_gis.filters import InBBoxFilter

from accounts.authentication import OsmAuthentication
from accounts.permissions import IsOwnerOrAdminOrReadOnly

from .models import Feedback
from .serializers import FeedbackSerializer


@extend_schema_view(
    list=extend_schema(description="List feedback entries, filterable by stac_id/action/bbox."),
    create=extend_schema(description="Submit accept/reject feedback on a predicted feature."),
    retrieve=extend_schema(description="Retrieve one feedback entry by id."),
    update=extend_schema(description="Replace a feedback entry (owner/admin only)."),
    partial_update=extend_schema(description="Patch a feedback entry (owner/admin only)."),
    destroy=extend_schema(description="Delete a feedback entry (owner/admin only)."),
)
class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, InBBoxFilter]
    filterset_fields = ["stac_id", "action", "user"]
    bbox_filter_field = "geom"

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)
