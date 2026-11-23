from django.urls import include, path
from rest_framework import routers

from .views import ValidationProjectViewSet

router = routers.DefaultRouter()
router.register(r"validation/projects", ValidationProjectViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
