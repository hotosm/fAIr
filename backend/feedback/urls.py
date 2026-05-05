from django.urls import include, path
from rest_framework import routers

from .views import FeedbackViewSet

router = routers.DefaultRouter()
router.register(r"feedback", FeedbackViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
