from django.urls import include, path
from rest_framework import routers

from .views import (
    ArtifactPresignView,
    BaseModelViewSet,
    CategoryViewSet,
    LocalModelViewSet,
    PinnedModelsView,
    StacAssetDownloadView,
)

router = routers.DefaultRouter()
router.register(r"categories", CategoryViewSet)
router.register(r"local-models", LocalModelViewSet)
router.register(r"base-models", BaseModelViewSet)

urlpatterns = [
    path("pinned-models/", PinnedModelsView.as_view(), name="pinned-models"),
    path(
        "stac-assets/<str:collection>/<str:item_id>/<str:asset>/",
        StacAssetDownloadView.as_view(),
        name="stac-asset",
    ),
    path(
        "artifacts/<str:bucket>/<path:key>",
        ArtifactPresignView.as_view(),
        name="artifact-presign",
    ),
    path("", include(router.urls)),
]
