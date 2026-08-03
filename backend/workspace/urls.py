from django.urls import path

from .views import WorkspaceListView, WorkspacePresignedView

urlpatterns = [
    path("workspace/", WorkspaceListView.as_view(), name="workspace-list"),
    path("workspace/url/", WorkspacePresignedView.as_view(), name="workspace-url"),
]
