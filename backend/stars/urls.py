from django.urls import path

from .views import StarView

urlpatterns = [
    path("stars/", StarView.as_view(), name="star"),
]
