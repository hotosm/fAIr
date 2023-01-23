from django.conf.urls import include
from django.urls import path
from rest_framework import routers

# now import the views.py file into this code
from .views import (
    AOIViewSet,
    APIStatus,
    DatasetViewSet,
    ImageDownloadView,
    LabelViewSet,
    ModelViewSet,
    PredictionView,
    RawdataApiView,
    TrainingViewSet,
    download_training_data,
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


urlpatterns = [
    path("", include(router.urls)),
    path("label/osm/fetch/<int:aoi_id>/", RawdataApiView.as_view()),
    path("dataset/image/build/", ImageDownloadView.as_view()),
    path("download/<int:dataset_id>/", download_training_data),
    path("training/status/<str:run_id>/", run_task_status),
    path("training/publish/<int:training_id>/", publish_training),
    path("prediction/", PredictionView.as_view()),
    path("status/", APIStatus.as_view()),
]
