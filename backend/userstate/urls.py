from django.urls import include, path
from rest_framework import routers

from .views import UserStateViewSet

router = routers.DefaultRouter()
router.register(r"user-state", UserStateViewSet, basename="user-state")

urlpatterns = [
    path("", include(router.urls)),
]
