from django.urls import include, path
from rest_framework import routers

from .views import (
    BaseModelViewSet,
    CategoryViewSet,
    LocalModelViewSet,
    PinnedModelsView,
)

router = routers.DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"local-models", LocalModelViewSet)
router.register(r"base-models", BaseModelViewSet)

urlpatterns = [
    path("pinned-models/", PinnedModelsView.as_view(), name="pinned-models"),
    path("", include(router.urls)),
]
