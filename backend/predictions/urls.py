from django.urls import include, path
from rest_framework import routers

from .views import PredictionViewSet

router = routers.DefaultRouter()
router.register(r"predictions", PredictionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
