from django.urls import include, path
from rest_framework import routers

from .views import BannerViewSet, UserNotificationViewSet

router = routers.DefaultRouter()
router.register(r"banners", BannerViewSet)
router.register(r"notifications/me", UserNotificationViewSet, basename="notifications")

urlpatterns = [
    path("", include(router.urls)),
]
