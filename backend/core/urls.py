from django.conf import settings
from django.conf.urls import include
from django.urls import path
from rest_framework import routers

from .views import (  # ApprovedPredictionsViewSet,; geojson2osmconverter,
    AOIViewSet,
    BannerViewSet,
    ConflateGeojson,
    DatasetCentroidView,
    DatasetViewSet,
    FeedbackAOIViewset,
    FeedbackLabelViewset,
    FeedbackView,
    FeedbackViewset,
    GenerateFeedbackAOIGpxView,
    GenerateGpxView,
    LabelUploadView,
    LabelViewSet,
    MarkAllNotificationsAsRead,
    MarkNotificationAsRead,
    ModelCentroidView,
    ModelViewSet,
    PredictionViewSet,
    RawdataApiAOIView,
    RawdataApiFeedbackView,
    TerminateTrainingView,
    TrainingViewSet,
    TrainingWorkspaceDownloadView,
    TrainingWorkspaceView,
    UserNotificationViewSet,
    UsersView,
    get_kpi_stats,
    publish_training,
    run_task_status,
)

# CURD Block
router = routers.DefaultRouter()
router.register(r"dataset", DatasetViewSet)
router.register(r"aoi", AOIViewSet)
router.register(r"label", LabelViewSet)

router.register(r"training", TrainingViewSet)
router.register(r"model", ModelViewSet)
router.register(r"feedback", FeedbackViewset)
# router.register(r"feedback-aoi", FeedbackAOIViewset)
# router.register(r"feedback-label", FeedbackLabelViewset)
router.register(r"banner", BannerViewSet)
router.register(r"notifications/me", UserNotificationViewSet, basename="notifications")
router.register(r"prediction", PredictionViewSet)


urlpatterns = [
    path("", include(router.urls)),
    path("label/osm/fetch/<int:aoi_id>/", RawdataApiAOIView.as_view()),
    path("label/upload/<int:aoi_id>/", LabelUploadView.as_view(), name="label-upload"),
    # path(
    #     "label/feedback/osm/fetch/<int:feedbackaoi_id>/",
    #     RawdataApiFeedbackView.as_view(),
    # ),
    path("users/", UsersView.as_view(), name="user-list-view"),
    path("models/centroid/", ModelCentroidView.as_view(), name="models-centroid"),
    path("datasets/centroid/", DatasetCentroidView.as_view(), name="datasets-centroid"),
    # path("download/<int:dataset_id>/", download_training_data),
    path("task/status/<str:run_id>/", run_task_status),
    path("training/publish/<int:training_id>/", publish_training),
    path(
        "training/terminate/<int:training_id>/",
        TerminateTrainingView.as_view(),
        name="cancel_training",
    ),
    # path("feedback/training/submit/", FeedbackView.as_view()),
    # path("status/", APIStatus.as_view()),
    # path("geojson2osm/", geojson2osmconverter, name="geojson2osmconverter"),
    # path("conflate/", ConflateGeojson, name="Conflate Geojson"),
    path("aoi/gpx/<int:aoi_id>/", GenerateGpxView.as_view()),
    # path(
    #     "feedback-aoi/gpx/<int:feedback_aoi_id>/", GenerateFeedbackAOIGpxView.as_view()
    # ),
    path(
        "workspace/download/<path:lookup_dir>/", TrainingWorkspaceDownloadView.as_view()
    ),
    path("workspace/<path:lookup_dir>/", TrainingWorkspaceView.as_view()),
    path("kpi/stats/", get_kpi_stats, name="get_kpi_stats"),
    path(
        "notifications/mark-as-read/<int:notification_id>/",
        MarkNotificationAsRead.as_view(),
        name="mark_notification_as_read",
    ),
    path(
        "notifications/mark-all-as-read/",
        MarkAllNotificationsAsRead.as_view(),
        name="mark_all_notifications_as_read",
    ),
]
