from django_filters.rest_framework import DjangoFilterBackend
from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated, IsOwnerOrReadOnly
from rest_framework import filters, status, viewsets
from rest_framework.response import Response
from rest_framework_gis.filters import InBBoxFilter


class BaseModelViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self, "filter_by_user") and self.filter_by_user:
            return queryset.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        if hasattr(serializer.Meta.model, "user"):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class BaseSpatialViewSet(BaseModelViewSet):
    filter_backends = [
        DjangoFilterBackend,
        InBBoxFilter,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    bbox_filter_include_overlapping = True


class UserAssignmentMixin:
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


class PublicFilterMixin:
    """Bypass auth for safe requests when a boolean field filter is true.

    Set `public_filter_field` on the viewset (default: "published").
    GET /endpoint/?published=true -> no auth, queryset scoped to field=True.
    All other requests follow normal auth flow.
    """

    public_filter_field = "published"

    def _is_public_filter_request(self):
        field = self.public_filter_field
        return (
            self.request.method in ("GET", "HEAD", "OPTIONS")
            and self.request.query_params.get(field, "").lower() == "true"
        )

    def get_permissions(self):
        if self._is_public_filter_request():
            return []
        return super().get_permissions()

    def get_queryset(self):
        if self._is_public_filter_request():
            return self.queryset.model.objects.filter(
                **{self.public_filter_field: True}
            )
        return super().get_queryset()
