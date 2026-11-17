from django.urls import include, path
from rest_framework import routers

from .views import BannerViewSet

router = routers.DefaultRouter()
router.register(r"banners", BannerViewSet, basename="banner")

urlpatterns = [
    path("", include(router.urls)),
]
