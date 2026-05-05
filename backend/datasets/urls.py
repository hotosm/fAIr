from django.urls import include, path
from rest_framework import routers

from .views import AOIViewSet, DatasetViewSet, GenerateGpxView

router = routers.DefaultRouter()
router.register(r"datasets", DatasetViewSet)
router.register(r"aois", AOIViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("aois/gpx/<int:aoi_id>/", GenerateGpxView.as_view(), name="aoi-gpx"),
]
