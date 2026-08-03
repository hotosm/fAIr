from django.urls import include, path
from rest_framework import routers

from .views import PredictionViewSet, PublicPredictionViewSet

router = routers.DefaultRouter()
router.register(r"predictions", PredictionViewSet)
router.register(r"public-predictions", PublicPredictionViewSet, basename="public-prediction")

urlpatterns = [
    path("", include(router.urls)),
]
