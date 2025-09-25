from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework_gis.filters import InBBoxFilter
from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated, IsOwnerOrReadOnly


class BaseModelViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self, 'filter_by_user') and self.filter_by_user:
            return queryset.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        if hasattr(serializer.Meta.model, 'user'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class BaseSpatialViewSet(BaseModelViewSet):
    filter_backends = [DjangoFilterBackend, InBBoxFilter, filters.SearchFilter, filters.OrderingFilter]
    bbox_filter_include_overlapping = True


class UserAssignmentMixin:
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)