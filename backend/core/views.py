from __future__ import absolute_import

import json
import logging
import os
import pathlib
import subprocess
import zipfile
from datetime import datetime
from urllib.parse import quote

import pyogrio

# import tensorflow as tf
from celery import current_app
from celery.result import AsyncResult
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.utils.timezone import now
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie, vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from django_q.tasks import async_task
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
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
from .exceptions import (
    ValidationException,
    ResourceNotFoundException,
    handle_validation_error,
    ExternalServiceException
)
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_gis.fields import GeometryField
from rest_framework_gis.filters import InBBoxFilter, TMSTileFilter
from shapely.geometry import box

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
from .serializers import (
    AOISerializer,
    BannerSerializer,
    DatasetCentroidSerializer,
    DatasetSerializer,
    FeedbackSerializer,
    LabelSerializer,
    ModelCentroidSerializer,
    ModelMetaSerializer,
    ModelSerializer,
    PredictionParamSerializer,
    TrainingSerializer,
    UserNotificationSerializer,
    UserSerializer,
    UserStatsSerializer,
)
from .tasks import predict_area, train_model
from .validators import validate_geojson
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
from .responses import APIResponse, APIResponseCodes
from .mixins import BaseModelViewSet, BaseSpatialViewSet, UserAssignmentMixin
from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse
from celery import current_app
from django.core.cache import cache
from rest_framework.decorators import api_view

@api_view(["GET"])
def health(request):
    status = {"postgresql": False, "redis": False, "celery_workers": False}
    try:
        connections['default'].cursor()
        status["postgresql"] = True
    except OperationalError:
        status["postgresql"] = False
    try:
        cache.set("health_check", "ok", timeout=1)
        if cache.get("health_check") == "ok":
            status["redis"] = True
    except Exception:
        status["redis"] = False
    try:
        i = current_app.control.inspect()
        active = i.active()
        status["celery_workers"] = bool(active)
    except Exception:
        status["celery_workers"] = False
    return JsonResponse({"status": status})


@api_view(['GET'])
def home(request):
    version = get_api_version()
    
    return Response({
        "name": "fAIr API",
        "version": version,
        "description": "AI-Assisted Mapping",
        "documentation": {
            "swagger": request.build_absolute_uri('/api/swagger/'),
            "redoc": request.build_absolute_uri('/api/redoc/'),
            "openapi_schema": request.build_absolute_uri('/api/swagger.json')
        },
        "api": {
            "v1": request.build_absolute_uri('/api/v1/')
        }
    })


class DatasetViewSet(BaseSpatialViewSet):
    """
    API endpoint for managing training datasets.
    
    Datasets contain training areas and associated models for AI-assisted mapping.
    Supports spatial filtering and full CRUD operations.
    """
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer

    @swagger_auto_schema(
        operation_summary="List all datasets",
        operation_description="Get paginated list of datasets. Supports filtering by status and search by name.",
        tags=['Datasets'],
        manual_parameters=[
            openapi.Parameter('search', openapi.IN_QUERY, description='Search by dataset name', type=openapi.TYPE_STRING, example='Building'),
            openapi.Parameter('status', openapi.IN_QUERY, description='Filter by status', type=openapi.TYPE_STRING, enum=['DRAFT', 'PUBLISHED']),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create a new dataset",
        operation_description="Create a dataset with imagery source URL and metadata. Authentication required.",
        tags=['Datasets'],
        responses={
            201: openapi.Response(description="Dataset created successfully"),
            400: "Validation error - check required fields",
            401: "Authentication required"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Get dataset details",
        operation_description="Retrieve detailed information about a specific dataset including model count and user info.",
        tags=['Datasets'],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update dataset",
        operation_description="Full update of a dataset. Requires ownership.",
        tags=['Datasets'],
        responses={
            200: "Dataset updated successfully",
            403: "Permission denied - must be owner",
            404: "Dataset not found"
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partially update dataset",
        operation_description="Update specific fields of a dataset. Requires ownership.",
        tags=['Datasets'],
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Delete dataset",
        operation_description="Delete a dataset and all associated data. Requires ownership or admin permissions.",
        tags=['Datasets'],
        responses={
            204: "Dataset deleted successfully",
            403: "Permission denied",
            404: "Dataset not found"
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


@method_decorator(ratelimit(key='user', rate='10/h', method='POST', block=True), name='create')
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

    @swagger_auto_schema(
        operation_description="Retrieve training details with feedback statistics",
        responses={
            200: openapi.Response(
                description="Training details including feedback counts",
                schema=TrainingSerializer
            )
        }
    )
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data.update({
            "feedback_count": Feedback.objects.filter(training=instance.id, action="REJECT").count(),
            "approved_predictions_count": Feedback.objects.filter(training=instance.id, action="ACCEPT").count()
        })
        return Response(data)


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

    @swagger_auto_schema(
        operation_summary="List all models",
        operation_description="Get paginated list of AI models. Filter by status, dataset, dates. Order by various fields.",
        tags=['Models'],
        manual_parameters=[
            openapi.Parameter('search', openapi.IN_QUERY, description='Search by model name or ID', type=openapi.TYPE_STRING, example='YOLOv8'),
            openapi.Parameter('status', openapi.IN_QUERY, description='Filter by status', type=openapi.TYPE_STRING, enum=['DRAFT', 'PUBLISHED']),
            openapi.Parameter('dataset', openapi.IN_QUERY, description='Filter by dataset ID', type=openapi.TYPE_INTEGER, example=1),
            openapi.Parameter('ordering', openapi.IN_QUERY, description='Order by field (prefix with - for descending)', type=openapi.TYPE_STRING, example='-created_at'),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create a new model",
        operation_description="Initialize a new AI model linked to a dataset. Choose YOLO or RAMP base model.",
        tags=['Models'],
        responses={
            201: openapi.Response(description="Model created successfully"),
            400: "Validation error",
            401: "Authentication required"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Get model details",
        operation_description="Get detailed model info including accuracy, published training, thumbnail URL.",
        tags=['Models'],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update model",
        operation_description="Full update of model metadata. Requires ownership.",
        tags=['Models'],
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partially update model",
        operation_description="Update specific fields like status, description, name. Requires ownership.",
        tags=['Models'],
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Delete model",
        operation_description="Delete a model. Requires ownership or admin permissions.",
        tags=['Models'],
        responses={
            204: "Model deleted successfully",
            403: "Permission denied"
        }
    )
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

    @swagger_auto_schema(
        operation_summary="List all AOIs",
        operation_description="Get list of Areas of Interest with GeoJSON polygon geometry.",
        tags=['AOI (Areas of Interest)'],
        manual_parameters=[
            openapi.Parameter('dataset', openapi.IN_QUERY, description='Filter by dataset ID', type=openapi.TYPE_INTEGER, example=1),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create a new AOI",
        operation_description="Create an Area of Interest with polygon geometry. Must be a valid Polygon.",
        tags=['AOI (Areas of Interest)'],
        responses={
            201: openapi.Response(description="AOI created successfully"),
            400: "Invalid geometry or dataset not found"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Get AOI details",
        operation_description="Retrieve AOI with full GeoJSON geometry and label statistics.",
        tags=['AOI (Areas of Interest)'],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update AOI",
        operation_description="Update AOI geometry or metadata. Requires ownership.",
        tags=['AOI (Areas of Interest)'],
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partially update AOI",
        operation_description="Update specific AOI fields. Requires ownership.",
        tags=['AOI (Areas of Interest)'],
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Delete AOI",
        operation_description="Delete an AOI and all associated labels. Requires ownership.",
        tags=['AOI (Areas of Interest)'],
        responses={
            204: "AOI deleted successfully",
            403: "Permission denied"
        }
    )
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

    @swagger_auto_schema(
        operation_description="Create or update a label. If a label with the same AOI and geometry exists, it will be updated.",
        request_body=LabelSerializer,
        responses={
            200: openapi.Response(description="Label created or updated successfully", schema=LabelSerializer),
            400: "Bad request"
        }
    )
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
            raise handle_validation_error("geojson_type", "Invalid GeoJSON type. Expected 'FeatureCollection'", geojson_data.get("type"))
        if "features" not in geojson_data or not isinstance(geojson_data["features"], list):
            raise handle_validation_error("geojson_features", "Invalid GeoJSON format. 'features' must be a list")
        if not geojson_data["features"]:
            raise handle_validation_error("geojson_features", "GeoJSON 'features' list is empty")

        first_feature = geojson_data["features"][0]
        if first_feature.get("type") != "Feature":
            raise handle_validation_error("geojson_feature_type", "Invalid GeoJSON feature type. Expected 'Feature'", first_feature.get("type"))
        if "geometry" not in first_feature or "properties" not in first_feature:
            raise handle_validation_error("geojson_feature_format", "Invalid GeoJSON feature format. 'geometry' and 'properties' are required")

        first_feature["properties"]["aoi"] = self.kwargs.get("aoi_id")
        serializer = LabelSerializer(data=first_feature)

        if not serializer.is_valid():
            raise ValidationException(message="Label validation failed", details={"serializer_errors": serializer.errors})


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
@ratelimit(key='user_or_ip', rate='30/m', method='GET', block=False)
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
                with open(log_file, 'r') as f:
                    lines = deque(f, maxlen=settings.LOG_LINE_STREAM_TRUNCATE_VALUE)
                    output = ''.join(lines)
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
        bucket_name = settings.BUCKET_NAME
        encoded_file_path = quote(lookup_dir.strip("/"))
        s3_prefix = f"{settings.PARENT_BUCKET_FOLDER}/{encoded_file_path}/"
        try:
            data = get_s3_directory(bucket_name, s3_prefix)
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

    def get_queryset(self):
        now = timezone.now()
        return Banner.objects.filter(
            start_date__lte=now
        ).filter(
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
    ordering = ["-created_at"]
    ordering_fields = ["created_at", "read_at", "is_read"]

    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)


class MarkNotificationAsRead(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    @swagger_auto_schema(
        operation_description="Mark a specific notification as read.",
    )
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

    @swagger_auto_schema(
        operation_description="Mark all unread notifications as read.",
        responses={
            200: openapi.Response(
                description="All unread notifications marked as read.",
                examples={
                    "application/json": {
                        "detail": "All unread notifications marked as read."
                    }
                },
            ),
        },
    )
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
            "status",
            "result_count",
            "task_id",
            "mapswipe_id",
            "config",
            "geom",
            "user",
        ]
        read_only_fields = (
            "created_at",
            "status",
            "user",
            "started_at",
            "finished_at",
            "task_id",
        )

    def validate_config(self, value):
        if value:
            required_fields = ["checkpoint", "zoom_level", "source"]
            missing_fields = [
                field for field in required_fields if field not in value
            ]
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


@method_decorator(ratelimit(key='user', rate='50/h', method='POST', block=True), name='create')
class PredictionViewSet(UserAssignmentMixin, BaseSpatialViewSet):
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
    filterset_fields = ["status", "id"]
    search_fields = ["description", "id"]
    ordering_fields = ["created_at", "id", "status"]
    permission_classes = [IsOsmAuthenticated, IsOwnerOrReadOnly]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        allowed_fields = ["mapswipe_id"]

        for field in request.data:
            if field not in allowed_fields:
                return Response(
                    {
                        "detail": f"Field '{field}' cannot be updated. Only {', '.join(allowed_fields)} can be updated."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().partial_update(request, *args, **kwargs)


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
