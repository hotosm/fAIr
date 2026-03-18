from django.conf import settings
from django.conf.urls import include
from django.urls import path
from rest_framework import routers

from .views import (
    AOIViewSet,
    BannerViewSet,
    ConflateGeojson,
    DatasetCentroidView,
    DatasetViewSet,
    FeedbackViewset,
    GenerateGpxView,
    LabelUploadView,
    LabelViewSet,
    MarkAllNotificationsAsRead,
    MarkNotificationAsRead,
    ModelCentroidView,
    ModelViewSet,
    PredictionCentroidView,
    PredictionViewSet,
    RawdataApiAOIView,
    StreamFGBView,
    TerminatePredictionView,
    TerminateTrainingView,
    TrainingViewSet,
    TrainingWorkspaceDownloadView,
    TrainingWorkspaceView,
    UserNotificationViewSet,
    UsersView,
    get_kpi_stats,
    health,
    publish_training,
    run_task_status,
)

if settings.ENABLE_FAIR_PREDICTOR:
    from .predictor_views import PredictorPredictView

# CURD Block
router = routers.DefaultRouter()
router.register(r"dataset", DatasetViewSet)
router.register(r"aoi", AOIViewSet)
router.register(r"label", LabelViewSet)

router.register(r"training", TrainingViewSet)
router.register(r"model", ModelViewSet)
router.register(r"feedback", FeedbackViewset)
router.register(r"banner", BannerViewSet)
router.register(r"notifications/me", UserNotificationViewSet, basename="notifications")
router.register(r"prediction", PredictionViewSet)
if settings.ENABLE_MAPSWIPE_INTEGREATION:
    from .views import MapswipeProjectViewSet

    router.register(
        r"mapswipe-project", MapswipeProjectViewSet, basename="mapswipe-project"
    )


urlpatterns = [
    path("", include(router.urls)),
    path("label/osm/fetch/<int:aoi_id>/", RawdataApiAOIView.as_view()),
    path("label/upload/<int:aoi_id>/", LabelUploadView.as_view(), name="label-upload"),
    path("users/", UsersView.as_view(), name="user-list-view"),
    path("models/centroid/", ModelCentroidView.as_view(), name="models-centroid"),
    path("datasets/centroid/", DatasetCentroidView.as_view(), name="datasets-centroid"),
    path(
        "prediction/centroid/",
        PredictionCentroidView.as_view(),
        name="prediction-centroid",
    ),
    path("task/status/<str:run_id>/", run_task_status),
    path("training/publish/<int:training_id>/", publish_training),
    path(
        "training/terminate/<int:training_id>/",
        TerminateTrainingView.as_view(),
        name="cancel_training",
    ),
    path(
        "prediction/terminate/<int:prediction_id>/",
        TerminatePredictionView.as_view(),
        name="cancel_prediction",
    ),
    path("conflate/", ConflateGeojson, name="Conflate Geojson"),
    path("aoi/gpx/<int:aoi_id>/", GenerateGpxView.as_view()),
    path(
        "workspace/download/<path:lookup_dir>/", TrainingWorkspaceDownloadView.as_view()
    ),
    path("workspace/<path:lookup_dir>/", TrainingWorkspaceView.as_view()),
    path(
        "workspace/stream/<path:file_path>", StreamFGBView.as_view(), name="stream-fgb"
    ),
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
    path("health/", health, name="health"),
]

if settings.ENABLE_FAIR_PREDICTOR:
    urlpatterns.append(
        path(
            "fairpredictor/predict/",
            PredictorPredictView.as_view(),
            name="predictor-predict",
        )
    )
