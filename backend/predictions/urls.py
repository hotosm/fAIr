from django.urls import include, path
from rest_framework import routers

from .views import PredictionViewSet, PublicPredictionResultView, PublicPredictionRetrieveView

router = routers.DefaultRouter()
router.register(r"predictions", PredictionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path(
        "public-predictions/<int:pk>/",
        PublicPredictionRetrieveView.as_view(),
        name="public-prediction-detail",
    ),
    path(
        "public-predictions/<int:pk>/result/",
        PublicPredictionResultView.as_view(),
        name="public-prediction-result",
    ),
]
