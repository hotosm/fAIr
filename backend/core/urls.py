from django.conf.urls import include
from django.urls import path
from rest_framework import routers

# now import the views.py file into this code
from .views import (
    AOIViewSet,
    APIStatus,
    ConflateGeojson,
    DatasetViewSet,
    FeedbackAOIViewset,
    FeedbackLabelViewset,
    FeedbackView,
    FeedbackViewset,
    GenerateFeedbackAOIGpxView,
    GenerateGpxView,
    LabelViewSet,
    ModelViewSet,
    PredictionView,
    RawdataApiAOIView,
    RawdataApiFeedbackView,
    TrainingViewSet,
    TrainingWorkspaceDownloadView,
    TrainingWorkspaceView,
    download_training_data,
    geojson2osmconverter,
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
router.register(r"feedback-aoi", FeedbackAOIViewset)
router.register(r"feedback-label", FeedbackLabelViewset)


urlpatterns = [
    path("", include(router.urls)),
    path("label/osm/fetch/<int:aoi_id>/", RawdataApiAOIView.as_view()),
    path(
        "label/feedback/osm/fetch/<int:feedbackaoi_id>/",
        RawdataApiFeedbackView.as_view(),
    ),
    # path("download/<int:dataset_id>/", download_training_data),
    path("training/status/<str:run_id>/", run_task_status),
    path("training/publish/<int:training_id>/", publish_training),
    path("prediction/", PredictionView.as_view()),
    path("feedback/training/submit/", FeedbackView.as_view()),
    path("status/", APIStatus.as_view()),
    path("geojson2osm/", geojson2osmconverter, name="geojson2osmconverter"),
    path("conflate/", ConflateGeojson, name="Conflate Geojson"),
    path("aoi/gpx/<int:aoi_id>/", GenerateGpxView.as_view()),
    path(
        "feedback-aoi/gpx/<int:feedback_aoi_id>/", GenerateFeedbackAOIGpxView.as_view()
    ),
    path("workspace/", TrainingWorkspaceView.as_view()),
    path(
        "workspace/download/<path:lookup_dir>/", TrainingWorkspaceDownloadView.as_view()
    ),
    path("workspace/<path:lookup_dir>/", TrainingWorkspaceView.as_view()),
]
