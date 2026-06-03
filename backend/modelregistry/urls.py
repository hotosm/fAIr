from django.urls import include, path
from rest_framework import routers

from .views import LocalModelViewSet

router = routers.DefaultRouter()
router.register(r"local-models", LocalModelViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
