from django.urls import include, path
from rest_framework import routers

from .views import TrainingViewSet

router = routers.DefaultRouter()
router.register(r"trainings", TrainingViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
