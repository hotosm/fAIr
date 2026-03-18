from __future__ import absolute_import

import json
import logging
import os
import pathlib
import random
import subprocess
import zipfile
from datetime import datetime
from tempfile import NamedTemporaryFile
from urllib.parse import quote

import httpx
import pyogrio
from botocore.exceptions import ClientError, NoCredentialsError

# import tensorflow as tf
from celery import current_app
from celery.result import AsyncResult
from django.conf import settings
from django.core.cache import cache
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import connections
from django.db.models import Count, Q
from django.db.utils import OperationalError
from django.http import (
    Http404,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseRedirect,
    JsonResponse,
)
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.timezone import now
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie, vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from django_q.tasks import async_task
from django_ratelimit.decorators import ratelimit
from geojson2osm import geojson2osm
from login.authentication import OsmAuthentication
from login.permissions import (
    IsAdminUser,
    IsOsmAuthenticated,
    IsOwnerOrReadOnly,
    IsStaffUser,
)
from osmconflator import conflate_geojson
from rest_framework import decorators, filters, serializers, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_gis.fields import GeometryField
from rest_framework_gis.filters import InBBoxFilter, TMSTileFilter
from shapely.geometry import box

from .exceptions import (
    ExternalServiceException,
    ResourceNotFoundException,
    ValidationException,
    handle_validation_error,
)
from .mapswipe_client import MapswipeClient
from .mixins import (
    BaseModelViewSet,
    BaseSpatialViewSet,
    PublicFilterMixin,
    UserAssignmentMixin,
)
from .models import (
    AOI,
    Banner,
    Dataset,
    Feedback,
    Label,
    Model,
    OsmUser,
    Prediction,
    Training,
    UserNotification,
)
from .responses import APIResponse, APIResponseCodes
from .serializers import (
    AOISerializer,
    BannerSerializer,
    DatasetCentroidSerializer,
    DatasetSerializer,
    FeedbackSerializer,
    LabelSerializer,
    MapswipeProjectCreateSerializer,
    ModelCentroidSerializer,
    ModelMetaSerializer,
    ModelSerializer,
    PredictionParamSerializer,
    TrainingSerializer,
    UserNotificationSerializer,
    UserSerializer,
    UserStatsSerializer,
)
from .tasks import predict_area, process_mapswipe_results, train_model
from .utils import (
    degrees_to_km,
    download_s3_file,
    get_api_version,
    get_s3_directory,
    gpx_generator,
    km_to_degrees,
    process_rawdata,
    request_rawdata,
    s3_object_exists,
    send_notification,
)
from .validators import validate_geojson


# @cache_page(60 * settings.CACHE_TIMEOUT_MINUTES)
@api_view(["GET"])
def health(request):
    status = {
        "postgresql": False,
        "redis": False,
        "celery_workers": {},
        "load": {},
        "s3": None,
    }
    try:
        connections["default"].cursor()
        status["postgresql"] = True
    except OperationalError:
        status["postgresql"] = False
    try:
        cache.set("health_check", "ok", timeout=1)
        if cache.get("health_check") == "ok":
            status["redis"] = True
    except Exception:
        status["redis"] = False
    inspect_active = {}
    try:
        i = current_app.control.inspect(timeout=1)
        inspect_registered = i.registered() or {}
        inspect_active = i.active() or {}
        worker_names = sorted(
            set(inspect_registered.keys()) | set(inspect_active.keys())
        )
        workers = [
            {
                "name": worker_name,
                "online": worker_name in inspect_active
                or worker_name in inspect_registered,
                "active": bool(inspect_active.get(worker_name)),
            }
            for worker_name in worker_names
        ]
        active_workers_count = sum(1 for worker in workers if worker["active"])
        online_workers_count = sum(1 for worker in workers if worker["online"])
        status["celery_workers"] = {
            "online": online_workers_count,
            "active": active_workers_count,
            "workers": workers,
        }
    except Exception:
        status["celery_workers"] = {}

    try:
        training_by_base_model = {
            base_model: {"submitted": submitted, "running": running}
            for base_model, submitted, running in Training.objects.values_list(
                "model__base_model"
            ).annotate(
                submitted=Count("id", filter=Q(status="SUBMITTED")),
                running=Count("id", filter=Q(status="RUNNING")),
            )
        }
        prediction_counts = Prediction.objects.aggregate(
            submitted=Count("id", filter=Q(status="SUBMITTED")),
            running=Count("id", filter=Q(status="RUNNING")),
        )
        status["load"] = {
            "training": training_by_base_model,
            "prediction": {
                "submitted": prediction_counts["submitted"],
                "running": prediction_counts["running"],
            },
        }
    except Exception:
        status["load"] = {}

    try:
        if settings.USE_S3_TO_UPLOAD_MODELS:
            bucket = settings.BUCKET_NAME
            if bucket and settings.S3_CLIENT:
                try:
                    settings.S3_CLIENT.head_bucket(Bucket=bucket)
                    status["s3"] = True
                except (ClientError, NoCredentialsError):
                    status["s3"] = False
            else:
                status["s3"] = False
        else:
            status["s3"] = None
    except Exception:
        status["s3"] = False

    if settings.ENABLE_MAPSWIPE_INTEGREATION:
        try:
            client = MapswipeClient(
                backend_url=settings.MAPSWIPE_BACKEND_URL,
                manager_url=settings.MAPSWIPE_MANAGER_URL,
                fb_auth_url=settings.MAPSWIPE_FB_AUTH_URL,
                fb_username=settings.MAPSWIPE_FB_USERNAME,
                fb_password=settings.MAPSWIPE_FB_PASSWORD,
                csrftoken_key=settings.MAPSWIPE_CSRFTOKEN_KEY,
            )
            status["mapswipe_api"] = True
        except Exception:
            status["mapswipe_api"] = False
        status["mapswipe_backend_url"] = settings.MAPSWIPE_BACKEND_URL
        status["mapswipe_manager_url"] = settings.MAPSWIPE_MANAGER_URL
        status["mapswipe_web_url"] = settings.MAPSWIPE_WEB_URL

    return JsonResponse({"status": status})


@api_view(["GET"])
def home(request):
    version = get_api_version()

    return Response(
        {
            "name": "fAIr API",
            "version": version,
            "description": "AI-Assisted Mapping",
            "documentation": {
                "swagger": request.build_absolute_uri("/api/swagger/"),
                "redoc": request.build_absolute_uri("/api/redoc/"),
                "openapi_schema": request.build_absolute_uri("/api/swagger.json"),
            },
            "api": {"v1": request.build_absolute_uri("/api/v1/")},
        }
    )


class DatasetViewSet(BaseSpatialViewSet):
    """
    API endpoint for managing training datasets.

    Datasets contain training areas and associated models for AI-assisted mapping.
    Supports spatial filtering and full CRUD operations.

    Query Parameters:
    - search: Search by dataset name
    - status: Filter by status (DRAFT, PUBLISHED)
    - ordering: Order results by field
    """

    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    public_methods = ["GET"]
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
    )
    filterset_fields = ["user", "status", "id"]
    search_fields = ["id", "name"]

    def partial_update(self, request, *args, **kwargs):
        if "offset" in request.data:
            # Bypass self.get_object() to skip IsOsmAuthenticated's ownership check
            # This allows ANY authenticated user to update the offset ## FIXME : I don't like this at all , for now i am allowing as a temp check later cloning of dataset would be recommended
            instance = get_object_or_404(self.get_queryset(), pk=kwargs.get("pk"))

            serializer = self.get_serializer(
                instance, data={"offset": request.data["offset"]}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)

        return super().partial_update(request, *args, **kwargs)


@method_decorator(
    ratelimit(key="user", rate="10/h", method="POST", block=True), name="create"
)
class TrainingViewSet(BaseModelViewSet):
    """
    API endpoint for managing model training sessions.

    Training sessions use labeled data from datasets to train AI models.
    Rate-limited to 10 creations per hour per user.
    """

    queryset = Training.objects.all()
    http_method_names = ["get", "post", "delete"]
    serializer_class = TrainingSerializer
    filterset_fields = ["model", "status", "user", "id"]
    ordering_fields = ["created_at", "accuracy", "id", "model", "status"]
    search_fields = ["description", "id", "model__name"]
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data.update(
            {
                "feedback_count": Feedback.objects.filter(
                    training=instance.id, action="REJECT"
                ).count(),
                "approved_predictions_count": Feedback.objects.filter(
                    training=instance.id, action="ACCEPT"
                ).count(),
            }
        )
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class FeedbackViewset(BaseSpatialViewSet):
    """
    API endpoint for managing training feedback.

    Feedback allows users to accept or reject predictions to improve model quality.
    Supports spatial filtering by geometry.
    """

    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    bbox_filter_field = "geom"
    filterset_fields = ["training", "user", "action"]
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


class ModelViewSet(BaseSpatialViewSet):
    """
    API endpoint for managing AI models.

    Models are trained versions that can be published for use in predictions.
    Supports filtering by status, dataset, and date ranges.
    """

    queryset = Model.objects.all()
    serializer_class = ModelSerializer
    filterset_fields = {
        "status": ["exact"],
        "created_at": ["exact", "gt", "gte", "lt", "lte"],
        "last_modified": ["exact", "gt", "gte", "lt", "lte"],
        "user": ["exact"],
        "dataset": ["exact"],
        "id": ["exact"],
    }
    ordering_fields = ["created_at", "last_modified", "id", "status"]
    search_fields = ["name", "id"]
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


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


class DatasetCentroidView(ListAPIView):
    queryset = Dataset.objects.filter(status=0)  ## only deliver the active datasets
    serializer_class = DatasetCentroidSerializer
    filter_backends = (
        # InBBoxFilter,
        DjangoFilterBackend,
        filters.SearchFilter,
    )
    filterset_fields = ["id"]
    search_fields = ["name", "id"]
    pagination_class = None


class UsersView(ListAPIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAdminUser, IsStaffUser]
    queryset = OsmUser.objects.all()
    serializer_class = UserStatsSerializer
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
    )
    filterset_fields = ["osm_id"]
    search_fields = ["username", "osm_id"]


class AOIViewSet(BaseModelViewSet):
    """
    API endpoint for managing Areas of Interest (AOI).

    AOIs define geographic regions within datasets for labeling and training.
    """

    queryset = AOI.objects.all()
    serializer_class = AOISerializer
    filterset_fields = ["dataset"]
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class LabelViewSet(BaseSpatialViewSet):
    """
    API endpoint for managing training labels.

    Labels are geographic features used to train AI models.
    Supports spatial filtering and GeoJSON upload.
    """

    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    bbox_filter_field = "geom"
    pagination_class = None
    filterset_fields = ["aoi", "aoi__dataset"]
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = LabelSerializer(data=request.data)

        if serializer.is_valid():
            aoi_id = serializer.validated_data.get("aoi")
            geom = serializer.validated_data.get("geom")

            existing_label = Label.objects.filter(aoi=aoi_id, geom=geom).first()

            if existing_label:
                serializer = LabelSerializer(existing_label, data=request.data)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
            else:
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
            except (json.JSONDecodeError, ValidationException) as e:
                raise e
        raise handle_validation_error("geojson_file", "No GeoJSON file provided")

    def validate_geojson(self, geojson_data):
        return validate_geojson(geojson_data)

    def validate_geojson(self, geojson_data):
        if geojson_data.get("type") != "FeatureCollection":
            raise handle_validation_error(
                "geojson_type",
                "Invalid GeoJSON type. Expected 'FeatureCollection'",
                geojson_data.get("type"),
            )
        if "features" not in geojson_data or not isinstance(
            geojson_data["features"], list
        ):
            raise handle_validation_error(
                "geojson_features", "Invalid GeoJSON format. 'features' must be a list"
            )
        if not geojson_data["features"]:
            raise handle_validation_error(
                "geojson_features", "GeoJSON 'features' list is empty"
            )

        first_feature = geojson_data["features"][0]
        if first_feature.get("type") != "Feature":
            raise handle_validation_error(
                "geojson_feature_type",
                "Invalid GeoJSON feature type. Expected 'Feature'",
                first_feature.get("type"),
            )
        if "geometry" not in first_feature or "properties" not in first_feature:
            raise handle_validation_error(
                "geojson_feature_format",
                "Invalid GeoJSON feature format. 'geometry' and 'properties' are required",
            )

        first_feature["properties"]["aoi"] = self.kwargs.get("aoi_id")
        serializer = LabelSerializer(data=first_feature)

        if not serializer.is_valid():
            raise ValidationException(
                message="Label validation failed",
                details={"serializer_errors": serializer.errors},
            )


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


class RawdataApiAOIView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, aoi_id, *args, **kwargs):
        """Downloads available osm data as labels within given AOI

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


# @api_view(["POST"])
# def geojson2osmconverter(request):
#     try:
#         geojson_data = json.loads(request.body)["geojson"]
#     except json.JSONDecodeError:
#         return HttpResponseBadRequest("Invalid input")

#     osm_xml = geojson2osm(geojson_data)

#     return HttpResponse(osm_xml, content_type="application/xml")


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
@ratelimit(key="user_or_ip", rate="30/m", method="GET", block=False)
def run_task_status(request, run_id: str):
    cache_key = f"task_status_{run_id}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return Response(cached_result)

    task_result = AsyncResult(run_id, app=current_app)

    if task_result.failed():
        result = {
            "id": run_id,
            "status": task_result.state,
            "error": str(task_result.result),
            "traceback": str(task_result.traceback),
        }
        cache.set(cache_key, result, 2)
        return Response(result)

    if task_result.state in ("PENDING", "STARTED"):
        log_file = os.path.join(settings.LOG_PATH, f"run_{run_id}.log")
        output = ""

        if os.path.exists(log_file):
            try:
                from collections import deque

                with open(log_file, "r") as f:
                    lines = deque(f, maxlen=settings.LOG_LINE_STREAM_TRUNCATE_VALUE)
                    output = "".join(lines)
            except Exception as e:
                output = str(e)

        result = {
            "id": run_id,
            "status": task_result.state,
            "result": task_result.result,
            "traceback": output,
        }
        cache.set(cache_key, result, 2)
        return Response(result)

    result = {
        "id": run_id,
        "status": task_result.state,
        "result": task_result.result,
    }
    cache.set(cache_key, result, 2)
    return Response(result)


DEFAULT_TILE_SIZE = 256


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
    else:
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


class GenerateGpxView(APIView):
    def get(self, request, aoi_id: int):
        aoi = get_object_or_404(AOI, id=aoi_id)
        geom_json = json.loads(aoi.geom.json)
        gpx_xml = gpx_generator(geom_json)
        return HttpResponse(gpx_xml, content_type="application/xml")


class TrainingWorkspaceView(APIView):
    @method_decorator(cache_page(60 * settings.CACHE_TIMEOUT_MINUTES))
    @method_decorator(vary_on_headers("access-token"))
    def get(self, request, lookup_dir):
        parent = settings.PARENT_BUCKET_FOLDER
        lookup = (lookup_dir or "").strip("/")
        encoded_file_path = quote(lookup) if lookup else ""
        s3_prefix = (
            f"{parent}/{encoded_file_path}/" if encoded_file_path else f"{parent}/"
        )

        try:
            data = get_s3_directory(settings.BUCKET_NAME, s3_prefix)
        except Exception as e:
            return Response({"Error": str(e)}, status=500)

        return Response(data, status=status.HTTP_200_OK)


class TrainingWorkspaceDownloadView(APIView):
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
    """
    API endpoint for managing notification banners.

    Banners are time-bound messages displayed to users.
    Read access is public, write operations require admin/staff permissions.
    """

    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAdminUser, IsStaffUser]
    pagination_class = None
    public_methods = ["GET"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        now = timezone.now()
        return Banner.objects.filter(start_date__lte=now).filter(
            end_date__gte=now
        ) | Banner.objects.filter(end_date__isnull=True)


@cache_page(60 * settings.CACHE_TIMEOUT_MINUTES)
@api_view(["GET"])
def get_kpi_stats(request):
    total_models_with_status_published = Model.objects.filter(status=0).count()
    total_registered_users = OsmUser.objects.count()
    total_accepted_predictions = Feedback.objects.filter(action="ACCEPT").count()
    total_feedback_labels = Feedback.objects.filter(action="REJECT").count()

    data = {
        "total_models_published": total_models_with_status_published,
        "total_registered_users": total_registered_users,
        "total_accepted_predictions": total_accepted_predictions,
        "total_feedback_labels": total_feedback_labels,
    }

    return Response(data)


class UserNotificationViewSet(ReadOnlyModelViewSet):
    """
    API endpoint for user notifications.

    Allows users to view their notifications. Read-only.
    Use separate endpoints to mark as read.
    """

    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    serializer_class = UserNotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["is_read"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    ordering = ["-created_at"]
    ordering_fields = ["created_at", "read_at", "is_read"]

    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)


class MarkNotificationAsRead(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, notification_id, format=None):
        try:
            notification = UserNotification.objects.get(
                id=notification_id, user=request.user
            )

            if notification.is_read:
                return Response(
                    {"detail": "Notification is already marked as read."},
                    status=status.HTTP_200_OK,
                )

            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()

            return Response(
                {"detail": "Notification marked as read."}, status=status.HTTP_200_OK
            )

        except UserNotification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND
            )


class MarkAllNotificationsAsRead(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, format=None):
        unread_notifications = UserNotification.objects.filter(
            user=request.user, is_read=False
        )

        if not unread_notifications.exists():
            return Response(
                {"detail": "No unread notifications found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        unread_notifications.update(is_read=True, read_at=timezone.now())
        return Response(
            {"detail": "All unread notifications marked as read."},
            status=status.HTTP_200_OK,
        )


class TerminateTrainingView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, training_id, format=None):
        try:
            training_instance = Training.objects.get(id=training_id, user=request.user)

            task_id = training_instance.task_id
            if not task_id:
                return Response(
                    {"detail": "No task associated with this training."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            task = AsyncResult(task_id, app=current_app)
            if (
                task.state in ["PENDING", "STARTED", "RETRY", "FAILURE"]
                and training_instance.status != "FAILED"
            ):
                current_app.control.revoke(task_id, terminate=True)
                training_instance.status = "FAILED"
                training_instance.finished_at = now()
                training_instance.save()
                send_notification(training_instance, "Cancelled")
                return Response(
                    {"detail": "Training task cancelled successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "detail": f"Task cannot be cancelled. Current state: {task.state}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Training.DoesNotExist:
            return Response(
                {"detail": "Training not found or do not belong to you"},
                status=status.HTTP_404_NOT_FOUND,
            )


class PredictionSerializer(serializers.ModelSerializer):
    geom = GeometryField()

    class Meta:
        model = Prediction
        fields = [
            "id",
            "description",
            "created_at",
            "started_at",
            "finished_at",
            "published_at",
            "status",
            # "result_count",
            "result",
            "task_id",
            "mapswipe_id",
            "config",
            "geom",
            "user",
            "published",
        ]
        read_only_fields = (
            "created_at",
            "status",
            "user",
            "started_at",
            "finished_at",
            "published_at",
            "task_id",
        )

    def validate_config(self, value):
        if value:
            required_fields = ["checkpoint", "zoom_level", "source"]
            missing_fields = [field for field in required_fields if field not in value]
            if missing_fields:
                raise serializers.ValidationError(
                    f"Missing required fields: {', '.join(missing_fields)}"
                )
        return value

    def validate_geom(self, value):
        from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon

        if isinstance(value, (str, dict)):
            geom = GEOSGeometry(str(value))
        else:
            geom = value

        if isinstance(geom, MultiPolygon):
            unified = geom.unary_union

            if isinstance(unified, MultiPolygon):
                extent = geom.extent
                from django.contrib.gis.geos import Polygon as GEOSPolygon

                bbox_polygon = GEOSPolygon.from_bbox(extent)
                bbox_polygon.srid = geom.srid
                return bbox_polygon
            else:
                return unified
        elif isinstance(geom, Polygon):
            return geom
        else:
            raise serializers.ValidationError(
                "Geometry must be Polygon or MultiPolygon"
            )

    def create(self, validated_data):
        instance = Prediction.objects.create(**validated_data)
        folder = instance.config.get("folder") if instance.config else None
        task = predict_area.apply_async(
            kwargs={
                "prediction_request_id": instance.id,
                "folder": folder,
            },
            queue=("predictions"),
        )
        logging.info("Record saved in queue")

        instance.task_id = task.id
        instance.save()
        logging.info(f"Prediction request queued with task ID {task.id}")
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if self.context.get("request") and self.context["request"].method == "GET":
            ret["user"] = UserSerializer(instance.user).data
        return ret


@method_decorator(
    ratelimit(key="user", rate="50/h", method="POST", block=True), name="create"
)
class PredictionViewSet(PublicFilterMixin, UserAssignmentMixin, BaseSpatialViewSet):
    """
    API endpoint for managing predictions.

    Predictions use trained models to detect features in new areas.
    Rate-limited to 50 creations per hour per user.
    Supports spatial filtering and status tracking.
    """

    http_method_names = ["get", "post", "patch"]
    queryset = Prediction.objects.all()
    bbox_filter_field = "geom"
    serializer_class = PredictionSerializer
    filterset_fields = ["status", "id", "published"]
    search_fields = ["description", "id"]
    ordering_fields = ["created_at", "id", "status", "published", "published_at"]
    permission_classes = [IsOsmAuthenticated, IsOwnerOrReadOnly]
    public_filter_field = "published"

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        allowed_fields = ["mapswipe_id", "published"]

        for field in request.data:
            if field not in allowed_fields:
                return Response(
                    {
                        "detail": f"Field '{field}' cannot be updated. Only {', '.join(allowed_fields)} can be updated."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().partial_update(request, *args, **kwargs)

    @decorators.action(detail=True, methods=["post"], url_path="retry")
    def retry(self, request, pk=None):
        """Retry a failed or finished prediction."""
        instance = self.get_object()
        if instance.status not in ["FAILED", "FINISHED"]:
            return Response(
                {"detail": f"Cannot retry {instance.status} prediction"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = predict_area.apply_async(
            kwargs={
                "prediction_request_id": instance.id,
                "folder": instance.config.get("folder") if instance.config else None,
            },
            queue=("predictions"),
        )
        instance.task_id = task.id
        instance.status = "SUBMITTED"
        instance.started_at = instance.finished_at = None
        instance.result = instance.result or {}
        instance.result["retried_at"] = timezone.now().isoformat()
        instance.save()
        return Response({"detail": "Queued for retry", "task_id": task.id})


class TerminatePredictionView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, prediction_id, format=None):
        try:
            prediction_instance = Prediction.objects.get(
                id=prediction_id, user=request.user
            )

            task_id = prediction_instance.task_id
            if not task_id:
                return Response(
                    {"detail": "No task associated with this prediction."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            task = AsyncResult(task_id, app=current_app)
            if (
                task.state in ["PENDING", "STARTED", "RETRY", "FAILURE"]
                and prediction_instance.status != "FAILED"
            ):
                current_app.control.revoke(task_id, terminate=True)
                prediction_instance.status = "FAILED"
                prediction_instance.finished_at = now()
                prediction_instance.save()
                send_notification(prediction_instance, "Cancelled")
                return Response(
                    {"detail": "Prediction task cancelled successfully."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "detail": f"Task cannot be cancelled. Current state: {task.state}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Prediction.DoesNotExist:
            return Response(
                {"detail": "Prediction not found or do not belong to you"},
                status=status.HTTP_404_NOT_FOUND,
            )


class StreamFGBView(APIView):
    @method_decorator(cache_page(60 * settings.CACHE_TIMEOUT_MINUTES))
    def get(self, request, file_path):
        if not file_path.endswith(".fgb"):
            return Response({"error": "Only .fgb files supported"}, status=400)

        bbox_param = request.query_params.get("bbox")
        if not bbox_param:
            return Response({"error": "bbox parameter required"}, status=400)

        try:
            minx, miny, maxx, maxy = [float(x) for x in bbox_param.split(",")]
        except (ValueError, TypeError):
            return Response({"error": "Invalid bbox format"}, status=400)

        if not (
            -180 <= minx <= 180
            and -180 <= maxx <= 180
            and -90 <= miny <= 90
            and -90 <= maxy <= 90
        ):
            return Response(
                {"error": "Bbox coordinates out of valid range"}, status=400
            )

        if minx >= maxx or miny >= maxy:
            return Response(
                {"error": "Invalid bbox: min values must be less than max values"},
                status=400,
            )

        width = maxx - minx
        height = maxy - miny

        center_lat = (miny + maxy) / 2
        max_dim_deg, _ = km_to_degrees(settings.FGB_MAX_BBOX_DIMENSION_KM, center_lat)

        lat_km, lon_km = degrees_to_km(1.0, center_lat)
        area_km2 = width * lon_km * height * lat_km

        if width > max_dim_deg or height > max_dim_deg:
            return Response(
                {
                    "error": f"Bbox dimension too large. Maximum allowed: {settings.FGB_MAX_BBOX_DIMENSION_KM}km "
                    f"(requested: ~{width * lon_km:.1f}km x {height * lat_km:.1f}km)"
                },
                status=400,
            )

        if area_km2 > settings.FGB_MAX_BBOX_AREA_KM2:
            return Response(
                {
                    "error": f"Bbox area too large. Maximum allowed: {settings.FGB_MAX_BBOX_AREA_KM2}km² "
                    f"(requested: ~{area_km2:.1f}km²)"
                },
                status=400,
            )

        output_format = request.query_params.get("format", "geojson").lower()
        if output_format not in ["geojson", "osmxml"]:
            return Response({"error": "Unsupported format"}, status=400)

        if not s3_object_exists(
            settings.BUCKET_NAME, f"{settings.PARENT_BUCKET_FOLDER}/{file_path}"
        ):
            return Response({"error": "File not found"}, status=404)

        s3_url = (
            f"s3://{settings.BUCKET_NAME}/{settings.PARENT_BUCKET_FOLDER}/{file_path}"
        )

        try:
            # Calculate area in km² for logging
            center_lat = (miny + maxy) / 2
            lat_km, lon_km = degrees_to_km(1.0, center_lat)
            area_km2 = width * lon_km * height * lat_km

            logging.info(
                f"FGB request: file={file_path}, bbox=({minx},{miny},{maxx},{maxy}), "
                f"area={area_km2:.1f}km², size={width * lon_km:.1f}x{height * lat_km:.1f}km, format={output_format}"
            )

            try:
                file_info = pyogrio.read_info(s3_url)
                file_bounds = file_info.get("total_bounds")

                if file_bounds is not None:
                    file_minx, file_miny, file_maxx, file_maxy = file_bounds

                    if (
                        maxx < file_minx
                        or minx > file_maxx
                        or maxy < file_miny
                        or miny > file_maxy
                    ):
                        logging.info(
                            "FGB request: No intersection with file bounds, returning empty result"
                        )
                        if output_format == "geojson":
                            return Response(
                                {"type": "FeatureCollection", "features": []}
                            )
                        else:
                            return HttpResponse(
                                '<?xml version="1.0"?><osm></osm>',
                                content_type="application/xml",
                            )
                    else:
                        logging.info(
                            "FGB request: Bbox intersects with file bounds, proceeding with read"
                        )
                else:
                    logging.warning(
                        "FGB request: File bounds not available from metadata"
                    )
            except Exception as bounds_ex:
                logging.warning(
                    f"FGB request: Could not read file bounds: {str(bounds_ex)}"
                )

            read_kwargs = {
                "bbox": (minx, miny, maxx, maxy),
                "use_arrow": settings.FGB_USE_ARROW_FOR_STREAMING,
            }

            if not settings.FGB_USE_ARROW_FOR_STREAMING:
                read_kwargs["max_features"] = settings.FGB_MAX_FEATURES_LIMIT

            gdf = pyogrio.read_dataframe(s3_url, **read_kwargs)

            if len(gdf) > settings.FGB_MAX_FEATURES_LIMIT:
                return Response(
                    {
                        "error": f"Too many features returned ({len(gdf)}). Maximum allowed: {settings.FGB_MAX_FEATURES_LIMIT}. "
                        f"Please use a smaller bounding box."
                    },
                    status=400,
                )
        except Exception as ex:
            error_msg = str(ex).lower()
            if any(
                keyword in error_msg
                for keyword in ["memory", "allocation", "out of memory"]
            ):
                return Response(
                    {"error": "Request too large. Please use a smaller bounding box."},
                    status=413,
                )
            else:
                return Response({"error": f"Error reading file: {str(ex)}"}, status=500)

        if gdf.empty:
            logging.info(
                "FGB request: No features found in bbox, returning empty result"
            )
            if output_format == "geojson":
                return Response({"type": "FeatureCollection", "features": []})
            else:
                return HttpResponse(
                    '<?xml version="1.0"?><osm></osm>', content_type="application/xml"
                )

        logging.info(f"FGB request: Successfully returned {len(gdf)} features")

        if output_format == "geojson":
            return Response(json.loads(gdf.to_json()))
        else:
            geojson_data = json.loads(gdf.to_json())
            osm_xml = geojson2osm(geojson_data)
            return HttpResponse(osm_xml, content_type="application/xml")


class MapswipeProjectViewSet(viewsets.ViewSet):
    """
    API endpoint for managing MapSwipe projects.
    """

    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    serializer_class = MapswipeProjectCreateSerializer

    def create(self, request):
        serializer = MapswipeProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        prediction_instance = None
        prediction_id = validated_data.get("prediction_id")
        if prediction_id:
            prediction_instance = get_object_or_404(Prediction, id=prediction_id)

        temp_file_path = None

        if "cover_image" in validated_data:
            cover_image = validated_data["cover_image"]
            with NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                if isinstance(cover_image, InMemoryUploadedFile):
                    temp_file.write(cover_image.read())
                else:
                    with open(cover_image.temporary_file_path(), "rb") as f:
                        temp_file.write(f.read())
                temp_file_path = temp_file.name

        try:
            with MapswipeClient(
                backend_url=settings.MAPSWIPE_BACKEND_URL,
                manager_url=settings.MAPSWIPE_MANAGER_URL,
                fb_auth_url=settings.MAPSWIPE_FB_AUTH_URL,
                fb_username=settings.MAPSWIPE_FB_USERNAME,
                fb_password=settings.MAPSWIPE_FB_PASSWORD,
                csrftoken_key=settings.MAPSWIPE_CSRFTOKEN_KEY,
            ) as client:
                organization_id = settings.MAPSWIPE_ORGANIZATION_ID
                new_project_id, image_asset_id = client.create_validation_project(
                    topic=validated_data["topic"],
                    region=validated_data["region"],
                    description=validated_data["description"],
                    instruction=validated_data["instruction"],
                    look_for=validated_data["look_for"],
                    project_number=random.randint(1, 100),
                    organization_id=organization_id,
                )

                client.update_project(
                    project_id=new_project_id,
                    geojson_url=validated_data["geojson_url"],
                    tms_url=validated_data["tms_url"],
                    image_asset_id=image_asset_id,
                    tutorial_id=settings.MAPSWIPE_TUTORIAL_ID,
                    verification_number=settings.MAPSWIPE_VERIFICATION_NUMBER,
                )

                status_update = client.update_project_status(
                    new_project_id, "READY_TO_PROCESS"
                )

                response_data = {
                    "project_id": new_project_id,
                    "status": status_update["result"]["status"],
                }

                if prediction_instance:
                    prediction_instance.mapswipe_id = new_project_id
                    prediction_instance.save()
                    response_data["prediction_id"] = prediction_instance.id
                    message = (
                        "MapSwipe project created successfully and linked to prediction"
                    )
                else:
                    message = "MapSwipe project created successfully"

                return APIResponse.success(
                    data=response_data,
                    message=message,
                    status_code=status.HTTP_201_CREATED,
                )
        except RuntimeError as e:
            return APIResponse.external_service_error(
                message=f"MapSwipe service error: {str(e)}"
            )
        except httpx.HTTPError as e:
            return APIResponse.external_service_error(
                message=f"Failed to communicate with MapSwipe: {str(e)}"
            )
        except Exception as e:
            return APIResponse.error(
                code=APIResponseCodes.EXTERNAL_SERVICE_ERROR,
                message=f"Unexpected error creating MapSwipe project: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            if temp_file_path:
                os.remove(temp_file_path)

    def retrieve(self, request, pk=None):
        try:
            pred_inst = get_object_or_404(Prediction, mapswipe_id=pk)

            with MapswipeClient(
                backend_url=settings.MAPSWIPE_BACKEND_URL,
                manager_url=settings.MAPSWIPE_MANAGER_URL,
                fb_auth_url=settings.MAPSWIPE_FB_AUTH_URL,
                fb_username=settings.MAPSWIPE_FB_USERNAME,
                fb_password=settings.MAPSWIPE_FB_PASSWORD,
                csrftoken_key=settings.MAPSWIPE_CSRFTOKEN_KEY,
            ) as client:
                project_details = client.get_project_details(pk)
                if project_details.get("status") == "FINISHED":
                    try:
                        results = pred_inst.result or None
                        if pred_inst.result and "mapswipe" in pred_inst.result:
                            results = pred_inst.result
                        else:
                            results_resp = client.get_project_results(pk)
                            results["mapswipe"] = results_resp
                            logging.info(f"Fetched MapSwipe results for project {pk}")
                            geojson_url = None
                            if (
                                results_resp
                                and results_resp.get(
                                    "exportAggregatedResultsWithGeometry"
                                )
                                and results_resp[
                                    "exportAggregatedResultsWithGeometry"
                                ].get("file")
                            ):
                                geojson_url = results_resp[
                                    "exportAggregatedResultsWithGeometry"
                                ]["file"].get("url", None)

                            if geojson_url:
                                task = process_mapswipe_results.apply_async(
                                    kwargs={
                                        "prediction_request_id": pred_inst.id,
                                    },
                                    queue=(
                                        "predictions"
                                    ),  # using same queue as prediction for now , on future we can have different queue if it gets overhelming at any point, which i don't assume it will be but if it does bravooo we have massive usage haha
                                )
                                results["mapswipe"]["pmtiles_conversion_status"] = (
                                    "SUBMITTED"
                                )
                                results["mapswipe"]["task_id"] = task.id
                                logging.info(
                                    f"Mapswipe results processing queued with task ID {task.id}"
                                )
                                pred_inst.result = results
                                pred_inst.save()

                        project_details["results"] = results

                    except Exception as e:
                        logging.error(
                            f"Error fetching or processing MapSwipe results for project {pk}: {str(e)}"
                        )
                        project_details["results"] = {
                            "error": "Failed to fetch or process results"
                        }
                return APIResponse.success(
                    data=project_details,
                    message="Project details retrieved successfully",
                )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return APIResponse.not_found(
                    message=f"MapSwipe project with ID {pk} not found or not associated with any prediction id"
                )
            return APIResponse.external_service_error(
                message=f"MapSwipe service returned error: {e.response.status_code}"
            )
        except RuntimeError as e:
            return APIResponse.external_service_error(
                message=f"MapSwipe service error: {str(e)}"
            )
        except httpx.HTTPError as e:
            return APIResponse.external_service_error(
                message=f"Failed to communicate with MapSwipe: {str(e)}"
            )
        except Http404 as e:
            return APIResponse.not_found(
                message=f"MapSwipe project with ID {pk} is not associated with any predictions"
            )
        except Exception as e:
            return APIResponse.error(
                code=APIResponseCodes.EXTERNAL_SERVICE_ERROR,
                message=f"Unexpected error retrieving project: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
