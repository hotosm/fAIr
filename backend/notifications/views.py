from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import OsmAuthentication

from .models import Banner, UserNotification
from .serializers import (
    BannerSerializer,
    UserNotificationSerializer,
)


@extend_schema_view(
    list=extend_schema(description="List currently-displayable banners."),
    create=extend_schema(description="Create a banner (admin tooling)."),
    retrieve=extend_schema(description="Retrieve one banner by id."),
    update=extend_schema(description="Replace a banner."),
    partial_update=extend_schema(description="Patch a banner."),
    destroy=extend_schema(description="Delete a banner."),
)
class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer

    def get_queryset(self):
        if self.action == "list":
            return Banner.objects.filter(start_date__lte=timezone.now()).order_by("-start_date")
        return super().get_queryset()


@extend_schema_view(
    list=extend_schema(description="List the authenticated user's notifications."),
    retrieve=extend_schema(description="Retrieve one of the caller's notifications by id."),
    mark_read=extend_schema(description="Mark one notification as read."),
    mark_all_read=extend_schema(description="Mark every unread notification as read."),
)
class UserNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserNotificationSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = UserNotification.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return UserNotification.objects.none()
        return UserNotification.objects.filter(user=self.request.user)

    @extend_schema(request=None, responses=UserNotificationSerializer)
    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk: int | None = None) -> Response:
        notification = self.get_object()
        notification.mark_as_read()
        return Response(UserNotificationSerializer(notification).data)

    @extend_schema(
        request=None,
        responses=inline_serializer(
            name="MarkAllReadResponse",
            fields={"detail": serializers.CharField()},
        ),
    )
    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request) -> Response:
        UserNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "ok"})
