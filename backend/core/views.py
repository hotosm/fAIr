from __future__ import absolute_import

import json
import logging
import os
import pathlib
import shutil
import subprocess
import sys
import time
import zipfile
from datetime import datetime
from tempfile import NamedTemporaryFile
from urllib.parse import quote

# import tensorflow as tf
from celery import current_app
from celery.result import AsyncResult
from django.conf import settings
from django.http import (
    FileResponse,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseRedirect,
    StreamingHttpResponse,
)
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie, vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from django_q.tasks import async_task
from drf_yasg.utils import swagger_auto_schema
from geojson2osm import geojson2osm
from login.authentication import OsmAuthentication
from login.permissions import IsAdminUser, IsOsmAuthenticated, IsStaffUser
from osmconflator import conflate_geojson
from rest_framework import decorators, filters, serializers, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter, TMSTileFilter

from .models import (
    AOI,
    ApprovedPredictions,
    Banner,
    Dataset,
    Feedback,
    FeedbackAOI,
    FeedbackLabel,
    Label,
    Model,
    OsmUser,
    Training,
)
from .serializers import (
    AOISerializer,
    ApprovedPredictionsSerializer,
    BannerSerializer,
    DatasetSerializer,
    FeedbackAOISerializer,
    FeedbackFileSerializer,
    FeedbackLabelSerializer,
    FeedbackParamSerializer,
    FeedbackSerializer,
    LabelSerializer,
    ModelCentroidSerializer,
    ModelSerializer,
    PredictionParamSerializer,
    UserSerializer,
)
from .tasks import train_model
from .utils import (
    download_s3_file,
    get_dir_size,
    get_local_metadata,
    get_s3_directory,
    gpx_generator,
    process_rawdata,
    request_rawdata,
    s3_object_exists,
)

if settings.ENABLE_PREDICTION_API:
    from predictor import predict


def home(request):
    return redirect("schema-swagger-ui")


class DatasetViewSet(
    viewsets.ModelViewSet
):  # This is datasetviewset , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = Dataset.objects.all()
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    serializer_class = DatasetSerializer  # connecting serializer
    filterset_fields = {
        "status": ["exact"],
        "created_at": ["exact", "gt", "gte", "lt", "lte"],
        "last_modified": ["exact", "gt", "gte", "lt", "lte"],
        "user": ["exact"],
        "id": ["exact"],
        "source_imagery": ["exact"],
    }
    ordering_fields = ["created_at", "last_modified", "id", "status"]
    search_fields = ["name", "id"]


class TrainingSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    user = UserSerializer(read_only=True)
    multimasks = serializers.BooleanField(required=False, default=False)
    input_contact_spacing = serializers.IntegerField(
        required=False, default=8, min_value=0, max_value=20
    )
    input_boundary_width = serializers.IntegerField(
        required=False, default=3, min_value=0, max_value=10
    )

    class Meta:
        model = Training
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want
        read_only_fields = (
            "created_at",
            "status",
            "user",
            "started_at",
            "finished_at",
            "accuracy",
        )

    def create(self, validated_data):
        model_id = validated_data["model"].id
        existing_trainings = Training.objects.filter(model_id=model_id).exclude(
            status__in=["FINISHED", "FAILED"]
        )
        if existing_trainings.exists():
            raise ValidationError(
                "Another training is already running or submitted for this model."
            )

        model = get_object_or_404(Model, id=model_id)
        if not Label.objects.filter(
            aoi__in=AOI.objects.filter(dataset=model.dataset)
        ).exists():
            raise ValidationError(
                "Error: No labels associated with the model, Create AOI & Labels for Dataset"
            )

        epochs = validated_data["epochs"]
        batch_size = validated_data["batch_size"]
        if model.base_model == "RAMP":
            if epochs > settings.RAMP_EPOCHS_LIMIT:
                raise ValidationError(
                    f"Epochs can't be greater than {settings.RAMP_EPOCHS_LIMIT} on this server"
                )
            if batch_size > settings.RAMP_BATCH_SIZE_LIMIT:
                raise ValidationError(
                    f"Batch size can't be greater than {settings.RAMP_BATCH_SIZE_LIMIT} on this server"
                )
        if model.base_model in ["YOLO_V8_V1", "YOLO_V8_V2"]:

            if epochs > settings.YOLO_EPOCHS_LIMIT:
                raise ValidationError(
                    f"Epochs can't be greater than {settings.YOLO_EPOCHS_LIMIT} on this server"
                )
            if batch_size > settings.YOLO_BATCH_SIZE_LIMIT:
                raise ValidationError(
                    f"Batch size can't be greater than {settings.YOLO_BATCH_SIZE_LIMIT} on this server"
                )
        user = self.context["request"].user
        validated_data["user"] = user
        # create the model instance
        multimasks = validated_data.get("multimasks", False)
        input_contact_spacing = validated_data.get("input_contact_spacing", 0.75)
        input_boundary_width = validated_data.get("input_boundary_width", 0.5)

        pop_keys = ["multimasks", "input_contact_spacing", "input_boundary_width"]

        for key in pop_keys:
            if key in validated_data.keys():
                validated_data.pop(key)

        instance = Training.objects.create(**validated_data)

        # run your function here
        task = train_model.delay(
            dataset_id=instance.model.dataset.id,
            training_id=instance.id,
            epochs=instance.epochs,
            batch_size=instance.batch_size,
            zoom_level=instance.zoom_level,
            source_imagery=instance.source_imagery
            or instance.model.dataset.source_imagery,
            freeze_layers=instance.freeze_layers,
            multimasks=multimasks,
            input_contact_spacing=input_contact_spacing,
            input_boundary_width=input_boundary_width,
        )
        logging.info("Record saved in queue")

        if not instance.source_imagery:
            instance.source_imagery = instance.model.dataset.source_imagery
        if multimasks:
            instance.description += f" Multimask params (ct/bw): {input_contact_spacing}/{input_boundary_width}"
        instance.task_id = task.id
        instance.save()
        print(f"Saved train model request to queue with id {task.id}")
        return instance


class TrainingViewSet(
    viewsets.ModelViewSet
):  # This is TrainingViewSet , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = Training.objects.all()
    http_method_names = ["get", "post", "delete"]
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    serializer_class = TrainingSerializer  # connecting serializer
    filterset_fields = ["model", "status"]
    ordering_fields = ["finished_at", "accuracy", "id", "model", "status"]
    search_fields = ["description", "id"]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        feedback_count = Feedback.objects.filter(
            training=instance.id
        ).count()  # cal feedback count
        data = serializer.data
        data["feedback_count"] = feedback_count
        return Response(data, status=status.HTTP_200_OK)


class FeedbackViewset(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = Feedback.objects.all()
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = FeedbackSerializer  # connecting serializer
    filterset_fields = ["training", "user", "feedback_type"]


class FeedbackAOIViewset(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = FeedbackAOI.objects.all()
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = FeedbackAOISerializer
    filterset_fields = [
        "training",
        "user",
    ]


class FeedbackLabelViewset(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = FeedbackLabel.objects.all()
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = FeedbackLabelSerializer
    bbox_filter_field = "geom"
    filter_backends = (
        InBBoxFilter,  # it will take bbox like this api/v1/label/?in_bbox=-90,29,-89,35 ,
        DjangoFilterBackend,
    )
    bbox_filter_include_overlapping = True
    filterset_fields = ["feedback_aoi", "feedback_aoi__training"]


class ModelViewSet(
    viewsets.ModelViewSet
):  # This is ModelViewSet , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = Model.objects.all()
    filter_backends = (
        InBBoxFilter,  # it will take bbox like this api/v1/model/?in_bbox=-90,29,-89,35 ,
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    serializer_class = ModelSerializer
    filterset_fields = {
        "status": ["exact"],
        "created_at": ["exact", "gt", "gte", "lt", "lte"],
        "last_modified": ["exact", "gt", "gte", "lt", "lte"],
        "user": ["exact"],
        "id": ["exact"],
    }
    ordering_fields = ["created_at", "last_modified", "id", "status"]
    search_fields = ["name", "id"]


class ModelCentroidView(ListAPIView):
    queryset = Model.objects.filter(status=0)  ## only deliver the published model
    serializer_class = ModelCentroidSerializer
    filter_backends = (
        # InBBoxFilter,
        DjangoFilterBackend,
        filters.SearchFilter,
    )
    filterset_fields = ["id"]
    search_fields = ["name"]
    pagination_class = None


class UsersView(ListAPIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    queryset = OsmUser.objects.all()
    serializer_class = UserSerializer
    filter_backends = (
        # InBBoxFilter,
        DjangoFilterBackend,
        filters.SearchFilter,
    )
    filterset_fields = ["id"]
    search_fields = ["username", "id"]


class AOIViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    authenticated_user_allowed_methods = ["POST", "DELETE"]
    queryset = AOI.objects.all()
    serializer_class = AOISerializer  # connecting serializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["dataset"]


class LabelViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = Label.objects.all()
    serializer_class = LabelSerializer  # connecting serializer
    bbox_filter_field = "geom"
    pagination_class = None
    filter_backends = (
        InBBoxFilter,  # it will take bbox like this api/v1/label/?in_bbox=-90,29,-89,35 ,
        TMSTileFilter,  # will serve as tms tiles https://wiki.openstreetmap.org/wiki/TMS ,  use like this ?tile=8/100/200 z/x/y which is equivalent to filtering on the bbox (-39.37500,-71.07406,-37.96875,-70.61261) # Note that the tile address start in the upper left, not the lower left origin used by some implementations.
        DjangoFilterBackend,
    )
    bbox_filter_include_overlapping = (
        True  # Optional to include overlapping labels in the tile served
    )
    filterset_fields = ["aoi", "aoi__dataset"]

    def create(self, request, *args, **kwargs):
        aoi_id = request.data.get("aoi")
        geom = request.data.get("geom")

        existing_label = Label.objects.filter(aoi=aoi_id, geom=geom).first()

        if existing_label:
            serializer = LabelSerializer(existing_label, data=request.data)
        else:
            serializer = LabelSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LabelUploadView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, aoi_id, *args, **kwargs):
        geojson_file = request.FILES.get("geojson_file")
        if geojson_file:
            try:
                geojson_data = json.load(geojson_file)
                self.validate_geojson(geojson_data)
                async_task(
                    "core.views.process_labels_geojson",
                    geojson_data,
                    aoi_id,
                )
                return Response(
                    {"status": "GeoJSON file is being processed"},
                    status=status.HTTP_202_ACCEPTED,
                )
            except (json.JSONDecodeError, ValidationError) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "No GeoJSON file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    def validate_geojson(self, geojson_data):
        if geojson_data.get("type") != "FeatureCollection":
            raise ValidationError("Invalid GeoJSON type. Expected 'FeatureCollection'.")
        if "features" not in geojson_data or not isinstance(
            geojson_data["features"], list
        ):
            raise ValidationError("Invalid GeoJSON format. 'features' must be a list.")
        if not geojson_data["features"]:
            raise ValidationError("GeoJSON 'features' list is empty.")

        # Validate the first feature
        first_feature = geojson_data["features"][0]
        if first_feature.get("type") != "Feature":
            raise ValidationError("Invalid GeoJSON feature type. Expected 'Feature'.")
        if "geometry" not in first_feature or "properties" not in first_feature:
            raise ValidationError(
                "Invalid GeoJSON feature format. 'geometry' and 'properties' are required."
            )

        # Validate the first feature with the serializer
        first_feature["properties"]["aoi"] = self.kwargs.get("aoi_id")
        serializer = LabelSerializer(data=first_feature)

        if not serializer.is_valid():
            raise ValidationError(serializer.errors)


def process_labels_geojson(geojson_data, aoi_id):
    obj = get_object_or_404(AOI, id=aoi_id)
    try:
        obj.label_status = AOI.DownloadStatus.RUNNING
        obj.save()
        for feature in geojson_data["features"]:
            feature["properties"]["aoi"] = aoi_id
            serializer = LabelSerializer(data=feature)
            if serializer.is_valid():
                serializer.save()

        obj.label_status = AOI.DownloadStatus.DOWNLOADED
        obj.label_fetched = datetime.utcnow()
        obj.save()
    except Exception as ex:
        obj.label_status = AOI.DownloadStatus.NOT_DOWNLOADED
        obj.save()
        logging.error(ex)


class ApprovedPredictionsViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    public_methods = ["GET"]
    queryset = ApprovedPredictions.objects.all()
    serializer_class = ApprovedPredictionsSerializer
    bbox_filter_field = "geom"
    filter_backends = (
        InBBoxFilter,
        # TMSTileFilter,
        DjangoFilterBackend,
    )
    bbox_filter_include_overlapping = True
    filterset_fields = ["training"]

    def create(self, request, *args, **kwargs):
        training_id = request.data.get("training")
        geom = request.data.get("geom")
        request.data["approved_by"] = self.request.user.osm_id

        existing_approved_feature = ApprovedPredictions.objects.filter(
            training=training_id, geom=geom
        ).first()

        if existing_approved_feature:
            serializer = ApprovedPredictionsSerializer(
                existing_approved_feature, data=request.data
            )
        else:

            serializer = ApprovedPredictionsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RawdataApiFeedbackView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, feedbackaoi_id, *args, **kwargs):
        """Downloads available osm data as labels within given feedback aoi

        Args:
            request (_type_): _description_
            feedbackaoi_id (_type_): _description_

        Returns:
            status: Success/Failed
        """
        obj = get_object_or_404(FeedbackAOI, id=feedbackaoi_id)
        try:
            obj.label_status = 0
            obj.save()
            file_download_url = request_rawdata(obj.geom.geojson)
            process_rawdata(file_download_url, feedbackaoi_id, feedback=True)
            obj.label_status = 1
            obj.label_fetched = datetime.utcnow()
            obj.save()
            return Response("Success", status=status.HTTP_201_CREATED)
        except Exception as ex:
            obj.label_status = -1
            obj.save()
            # raise ex
            logging.error(ex)
            return Response("OSM Fetch Failed", status=500)


class RawdataApiAOIView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, aoi_id, *args, **kwargs):
        """Downloads available osm data as labels within given feedback

        Args:
            request (_type_): _description_
            aoi_id (_type_): _description_

        Returns:
            status: Success/Failed
        """
        obj = get_object_or_404(AOI, id=aoi_id)
        async_task("core.views.process_rawdata_task", obj.geom.geojson, aoi_id)
        return Response("Processing started", status=status.HTTP_202_ACCEPTED)


def process_rawdata_task(geom_geojson, aoi_id):
    obj = get_object_or_404(AOI, id=aoi_id)
    try:
        obj.label_status = AOI.DownloadStatus.RUNNING
        obj.save()
        file_download_url = request_rawdata(geom_geojson)
        process_rawdata(file_download_url, aoi_id)
        obj.label_status = AOI.DownloadStatus.DOWNLOADED
        obj.label_fetched = datetime.utcnow()
        obj.save()
    except Exception as ex:
        obj.label_status = AOI.DownloadStatus.NOT_DOWNLOADED
        obj.save()
        raise ex


@api_view(["GET"])
def download_training_data(request, dataset_id: int):
    """Used for Delivering our training folder to user.
    Returns zip file if it is present on our server if not returns error
    """

    file_path = os.path.join(
        settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}", "input"
    )
    zip_temp_path = os.path.join(
        settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}.zip"
    )
    directory = pathlib.Path(file_path)
    if os.path.exists(directory):
        zf = zipfile.ZipFile(zip_temp_path, "w", zipfile.ZIP_DEFLATED)
        for file_path in directory.iterdir():
            zf.write(file_path, arcname=file_path.name)
        zf.close()
        if os.path.exists(zip_temp_path):
            response = HttpResponse(open(zip_temp_path, "rb"))
            response.headers["Content-Type"] = "application/x-zip-compressed"

            response.headers["Content-Disposition"] = (
                f"attachment; filename=training_{dataset_id}_all_data.zip"
            )
            return response
        else:
            # "error": "File Doesn't Exist or has been cleared up from system",
            return HttpResponse(status=204)

    else:
        # "error": "Dataset haven't been downloaded or doesn't exist",
        return HttpResponse(status=204)


@api_view(["POST"])
def geojson2osmconverter(request):
    try:
        geojson_data = json.loads(request.body)["geojson"]
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid input")

    osm_xml = geojson2osm(geojson_data)

    return HttpResponse(osm_xml, content_type="application/xml")


@api_view(["POST"])
def ConflateGeojson(request):
    try:
        geojson_data = json.loads(request.body)["geojson"]
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid input")

    conflated_geojson = conflate_geojson(
        geojson_data, remove_conflated=True, api_url=settings.EXPORT_TOOL_API_URL
    )

    return Response(conflated_geojson, status=200)


@api_view(["GET"])
def run_task_status(request, run_id: str):
    """Gives the status of running task from background process

    Args:
        request (_type_): _description_
        run_id (_type_): _description_
    """
    task_result = AsyncResult(run_id, app=current_app)
    if task_result.failed():
        return Response(
            {
                "id": run_id,
                "status": task_result.state,
                "error": str(task_result.result),
                "traceback": str(task_result.traceback),
            }
        )
    elif task_result.state == "PENDING" or task_result.state == "STARTED":
        log_file = os.path.join(settings.LOG_PATH, f"run_{run_id}.log")
        try:
            # read the last 10 lines of the log file
            cmd = ["tail", "-n", str(settings.LOG_LINE_STREAM_TRUNCATE_VALUE), log_file]
            # print(cmd)
            output = subprocess.check_output(cmd).decode("utf-8")
        except Exception as e:
            output = str(e)
        result = {
            "id": run_id,
            "status": task_result.state,
            "result": task_result.result,
            "traceback": str(output),
        }
        return Response(result)
    else:
        result = {
            "id": run_id,
            "status": task_result.state,
            "result": task_result.result,
        }
        return Response(result)


class FeedbackView(APIView):
    """Applies Associated feedback to Training Published Checkpoint

    Args:
        APIView (_type_): _description_

    Returns:
        _type_: _description_
    """

    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    @swagger_auto_schema(
        request_body=FeedbackParamSerializer, responses={status.HTTP_200_OK: "ok"}
    )
    def post(self, request, *args, **kwargs):
        res_serializer = FeedbackParamSerializer(data=request.data)

        if res_serializer.is_valid():
            deserialized_data = res_serializer.data
            training_id = deserialized_data["training_id"]
            training_instance = Training.objects.get(id=training_id)
            if Training.objects.filter(
                model_id=training_instance.model, status__in=["RUNNING", "SUBMITTED"]
            ).exists():
                raise ValidationError(
                    "Another training/feedback is in progress or submitted for this model."
                )

            zoom_level = deserialized_data.get("zoom_level", [19, 20])
            epochs = deserialized_data.get("epochs", 20)
            batch_size = deserialized_data.get("batch_size", 8)

            instance = Training.objects.create(
                model=training_instance.model,
                status="SUBMITTED",
                description=f"Feedback of Training {training_id}",
                user=self.request.user,
                zoom_level=zoom_level,
                epochs=epochs,
                batch_size=batch_size,
                source_imagery=training_instance.source_imagery,
            )
            task = train_model.delay(
                dataset_id=instance.model.dataset.id,
                training_id=instance.id,
                epochs=instance.epochs,
                batch_size=instance.batch_size,
                zoom_level=instance.zoom_level,
                source_imagery=instance.source_imagery,
                feedback=training_id,
                freeze_layers=True,  # True by default for feedback
            )
            if not instance.source_imagery:
                instance.source_imagery = instance.model.dataset.source_imagery
            instance.task_id = task.id
            instance.save()
            print(f"Saved Feedback train model request to queue with id {task.id}")
            return HttpResponse(status=200)

        return Response(res_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


DEFAULT_TILE_SIZE = 256

if settings.ENABLE_PREDICTION_API:
    from orthogonalizer import othogonalize_poly

    class PredictionView(APIView):
        authentication_classes = [OsmAuthentication]
        permission_classes = [IsOsmAuthenticated]

        @swagger_auto_schema(
            request_body=PredictionParamSerializer, responses={status.HTTP_200_OK: "ok"}
        )
        def post(self, request, *args, **kwargs):
            """Predicts on bbox by published model"""
            res_serializer = PredictionParamSerializer(data=request.data)
            if res_serializer.is_valid(raise_exception=True):
                deserialized_data = res_serializer.data
                bbox = deserialized_data["bbox"]
                use_josm_q = deserialized_data["use_josm_q"]
                model_instance = get_object_or_404(
                    Model, id=deserialized_data["model_id"]
                )
                if not model_instance.published_training:
                    return Response("Model is not published yet", status=404)
                training_instance = get_object_or_404(
                    Training, id=model_instance.published_training
                )

                source_img_in_dataset = model_instance.dataset.source_imagery
                source = (
                    deserialized_data["source"]
                    if deserialized_data["source"]
                    else source_img_in_dataset
                )
                zoom_level = deserialized_data["zoom_level"]
                try:
                    start_time = time.time()
                    model_path = os.path.join(
                        settings.TRAINING_WORKSPACE,
                        f"dataset_{model_instance.dataset.id}",
                        "output",
                        f"training_{training_instance.id}",
                        "checkpoint.tflite",
                    )
                    # give high priority to tflite model format if not avilable fall back to .h5 if not use default .tf
                    if not os.path.exists(model_path):
                        model_path = os.path.join(
                            settings.TRAINING_WORKSPACE,
                            f"dataset_{model_instance.dataset.id}",
                            "output",
                            f"training_{training_instance.id}",
                            "checkpoint.tf",
                        )
                    geojson_data = predict(
                        bbox=bbox,
                        model_path=model_path,
                        zoom_level=zoom_level,
                        tms_url=source,
                        tile_size=DEFAULT_TILE_SIZE,
                        confidence=(
                            deserialized_data["confidence"] / 100
                            if "confidence" in deserialized_data
                            else 0.5
                        ),
                        tile_overlap_distance=(
                            deserialized_data["tile_overlap_distance"]
                            if "tile_overlap_distance" in deserialized_data
                            else 0.15
                        ),
                    )
                    print(
                        f"It took {round(time.time()-start_time)}sec for generating predictions"
                    )
                    for feature in geojson_data["features"]:
                        feature["properties"]["building"] = "yes"
                        feature["properties"]["source"] = "fAIr"
                        if use_josm_q is True:
                            feature["geometry"] = othogonalize_poly(
                                feature["geometry"],
                                maxAngleChange=(
                                    deserialized_data["max_angle_change"]
                                    if "max_angle_change" in deserialized_data
                                    else 15
                                ),
                                skewTolerance=(
                                    deserialized_data["skew_tolerance"]
                                    if "skew_tolerance" in deserialized_data
                                    else 15
                                ),
                            )

                    print(
                        f"Prediction API took ({round(time.time()-start_time)} sec) in total"
                    )

                    ## TODO : can send osm xml format from here as well using geojson2osm
                    return Response(geojson_data, status=status.HTTP_201_CREATED)
                except ValueError as e:
                    if str(e) == "No Features Found":
                        return Response("No features found", status=204)
                    else:
                        return Response(str(e), status=500)


@api_view(["POST"])
@decorators.authentication_classes([OsmAuthentication])
@decorators.permission_classes([IsOsmAuthenticated])
def publish_training(request, training_id: int):
    """Publishes training for model"""
    training_instance = get_object_or_404(Training, id=training_id)
    model_instance = get_object_or_404(Model, id=training_instance.model.id)

    if training_instance.status != "FINISHED":
        return Response("Training is not FINISHED", status=409)
    if model_instance.base_model == "RAMP":
        if training_instance.accuracy < 70:
            return Response(
                "Can't publish the training since its accuracy is below 70%", status=403
            )
    else:  ## Training publish limit for other model than ramp , TODO : Change this limit after testing for yolo
        if training_instance.accuracy < 5:
            return Response(
                "Can't publish the training since its accuracy is below 5%", status=403
            )

    # Check if the current user is the owner of the model
    if model_instance.user != request.user:
        return Response("You are not allowed to publish this training", status=403)

    model_instance.published_training = training_instance.id
    model_instance.status = 0
    model_instance.save()

    return Response("Training Published", status=status.HTTP_201_CREATED)


# class APIStatus(APIView):
#     def get(self, request):
#         res = {
#             "tensorflow_version": tf.__version__,
#             "No of GPU Available": len(
#                 tf.config.experimental.list_physical_devices("GPU")
#             ),
#             "API Status": "Healthy",  # static for now should be dynamic TODO
#         }
#         return Response(res, status=status.HTTP_200_OK)


class GenerateGpxView(APIView):
    def get(self, request, aoi_id: int):
        aoi = get_object_or_404(AOI, id=aoi_id)
        # Convert the polygon field to GPX format
        geom_json = json.loads(aoi.geom.json)
        # Create a new GPX object
        gpx_xml = gpx_generator(geom_json)
        return HttpResponse(gpx_xml, content_type="application/xml")


class GenerateFeedbackAOIGpxView(APIView):
    def get(self, request, feedback_aoi_id: int):
        aoi = get_object_or_404(FeedbackAOI, id=feedback_aoi_id)
        # Convert the polygon field to GPX format
        geom_json = json.loads(aoi.geom.json)
        # Create a new GPX object
        gpx_xml = gpx_generator(geom_json)
        return HttpResponse(gpx_xml, content_type="application/xml")


class TrainingWorkspaceView(APIView):
    @method_decorator(cache_page(60 * 15))
    @method_decorator(vary_on_headers("access-token"))
    def get(self, request, lookup_dir):
        bucket_name = settings.BUCKET_NAME
        encoded_file_path = quote(lookup_dir.strip("/"))
        s3_prefix = f"{settings.PARENT_BUCKET_FOLDER}/{encoded_file_path}/"
        try:
            data = get_s3_directory(bucket_name, s3_prefix)
        except Exception as e:
            return Response({"Error": str(e)}, status=500)

        return Response(data, status=status.HTTP_200_OK)


class TrainingWorkspaceDownloadView(APIView):
    # authentication_classes = [OsmAuthentication]
    # permission_classes = [IsOsmAuthenticated]

    # def dispatch(self, request, *args, **kwargs):
    #     lookup_dir = kwargs.get("lookup_dir")
    #     if lookup_dir.endswith("training_accuracy.png"):
    #         # bypass
    #         self.authentication_classes = []
    #         self.permission_classes = []

    #     return super().dispatch(request, *args, **kwargs)

    def get(self, request, lookup_dir):
        s3_key = os.path.join(settings.PARENT_BUCKET_FOLDER, lookup_dir)
        bucket_name = settings.BUCKET_NAME

        if not s3_object_exists(bucket_name, s3_key):
            return Response("File not found in S3", status=404)
        presigned_url = download_s3_file(bucket_name, s3_key)
        # ?url_only=true
        url_only = request.query_params.get("url_only", "false").lower() == "true"

        if url_only:
            return Response({"result": presigned_url})
        else:
            return HttpResponseRedirect(presigned_url)


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAdminUser, IsStaffUser]
    public_methods = ["GET"]
    pagination_class = None

    def get_queryset(self):
        now = timezone.now()
        return Banner.objects.filter(start_date__lte=now).filter(
            end_date__gte=now
        ) | Banner.objects.filter(end_date__isnull=True)


@cache_page(60 * 15)  ## Cache for 15 mins
# @vary_on_cookie
@api_view(["GET"])
def get_kpi_stats(request):
    total_models_with_status_published = Model.objects.filter(status=0).count()
    total_registered_users = OsmUser.objects.count()
    total_approved_predictions = ApprovedPredictions.objects.count()
    total_feedback_labels = FeedbackLabel.objects.count()

    data = {
        "total_models_published": total_models_with_status_published,
        "total_registered_users": total_registered_users,
        "total_accepted_predictions": total_approved_predictions,
        "total_feedback_labels": total_feedback_labels,
    }

    return Response(data)
