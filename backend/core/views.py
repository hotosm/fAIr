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

import tensorflow as tf
from celery import current_app
from celery.result import AsyncResult
from django.conf import settings
from django.http import (
    FileResponse,
    HttpResponse,
    HttpResponseBadRequest,
    StreamingHttpResponse,
)
from django.shortcuts import get_object_or_404, redirect
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from geojson2osm import geojson2osm
from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated
from orthogonalizer import othogonalize_poly
from osmconflator import conflate_geojson
from predictor import predict
from rest_framework import decorators, serializers, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter, TMSTileFilter

from .models import (
    AOI,
    Dataset,
    Feedback,
    FeedbackAOI,
    FeedbackLabel,
    Label,
    Model,
    Training,
)
from .serializers import (
    AOISerializer,
    DatasetSerializer,
    FeedbackAOISerializer,
    FeedbackFileSerializer,
    FeedbackLabelSerializer,
    FeedbackParamSerializer,
    FeedbackSerializer,
    LabelSerializer,
    ModelSerializer,
    PredictionParamSerializer,
)
from .tasks import train_model
from .utils import get_dir_size, gpx_generator, process_rawdata, request_rawdata


def home(request):
    return redirect("schema-swagger-ui")


class DatasetViewSet(
    viewsets.ModelViewSet
):  # This is datasetviewset , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer  # connecting serializer


class TrainingSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Training
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want
        read_only_fields = (
            "created_at",
            "status",
            "created_by",
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

        if epochs > settings.EPOCHS_LIMIT:
            raise ValidationError(
                f"Epochs can't be greater than {settings.EPOCHS_LIMIT} on this server"
            )
        if batch_size > settings.BATCH_SIZE_LIMIT:
            raise ValidationError(
                f"Batch size can't be greater than {settings.BATCH_SIZE_LIMIT} on this server"
            )

        user = self.context["request"].user
        validated_data["created_by"] = user
        # create the model instance
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
        )
        if not instance.source_imagery:
            instance.source_imagery = instance.model.dataset.source_imagery
        instance.task_id = task.id
        instance.save()
        print(f"Saved train model request to queue with id {task.id}")
        return instance


class TrainingViewSet(
    viewsets.ModelViewSet
):  # This is TrainingViewSet , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Training.objects.all()
    http_method_names = ["get", "post", "delete"]
    serializer_class = TrainingSerializer  # connecting serializer
    filterset_fields = ["model", "status"]


class FeedbackViewset(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Feedback.objects.all()
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = FeedbackSerializer  # connecting serializer
    filterset_fields = ["training", "user", "feedback_type"]


class FeedbackAOIViewset(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
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
    permission_allowed_methods = ["GET"]
    queryset = FeedbackLabel.objects.all()
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = FeedbackLabelSerializer
    bbox_filter_field = "geom"
    filter_backends = (
        InBBoxFilter,  # it will take bbox like this api/v1/label/?in_bbox=-90,29,-89,35 ,
    )
    bbox_filter_include_overlapping = True
    filterset_fields = ["feedback_aoi", "feedback_aoi__training"]


class ModelViewSet(
    viewsets.ModelViewSet
):  # This is ModelViewSet , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Model.objects.all()
    serializer_class = ModelSerializer  # connecting serializer
    filterset_fields = ["status"]


class AOIViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = AOI.objects.all()
    serializer_class = AOISerializer  # connecting serializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["dataset"]


class LabelViewSet(viewsets.ModelViewSet):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Label.objects.all()
    serializer_class = LabelSerializer  # connecting serializer
    bbox_filter_field = "geom"
    filter_backends = (
        InBBoxFilter,  # it will take bbox like this api/v1/label/?in_bbox=-90,29,-89,35 ,
        # TMSTileFilter,  # will serve as tms tiles https://wiki.openstreetmap.org/wiki/TMS ,  use like this ?tile=8/100/200 z/x/y which is equivalent to filtering on the bbox (-39.37500,-71.07406,-37.96875,-70.61261) # Note that the tile address start in the upper left, not the lower left origin used by some implementations.
        DjangoFilterBackend,
    )
    bbox_filter_include_overlapping = (
        True  # Optional to include overlapping labels in the tile served
    )
    filterset_fields = ["aoi", "aoi__dataset"]

    def create(self, request, *args, **kwargs):
        aoi_id = request.data.get("aoi")
        geom = request.data.get("geom")

        # Check if a label with the same AOI and geometry exists
        existing_label = Label.objects.filter(aoi=aoi_id, geom=geom).first()

        if existing_label:
            # If it exists, update the existing label
            serializer = LabelSerializer(existing_label, data=request.data)
        else:
            # If it doesn't exist, create a new label
            serializer = LabelSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data, status=status.HTTP_200_OK
            )  # 200 for update, 201 for create
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
        try:
            obj.label_status = 0
            obj.save()
            file_download_url = request_rawdata(obj.geom.geojson)
            process_rawdata(file_download_url, aoi_id)
            obj.label_status = 1
            obj.label_fetched = datetime.utcnow()
            obj.save()
            return Response("Success", status=status.HTTP_201_CREATED)
        except Exception as ex:
            obj.label_status = -1
            obj.save()
            # raise ex
            return Response("OSM Fetch Failed", status=500)


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

            response.headers[
                "Content-Disposition"
            ] = f"attachment; filename=training_{dataset_id}_all_data.zip"
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

    conflated_geojson = conflate_geojson(geojson_data, remove_conflated=True)

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
        log_file = os.path.join(settings.LOG_PATH, f"run_{run_id}_log.txt")
        try:
            # read the last 10 lines of the log file
            output = subprocess.check_output(["tail", "-n", "10", log_file]).decode(
                "utf-8"
            )
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
                created_by=self.request.user,
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
            model_instance = get_object_or_404(Model, id=deserialized_data["model_id"])
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
                        "checkpoint.h5",
                    )
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
                    confidence=deserialized_data["confidence"] / 100
                    if "confidence" in deserialized_data
                    else 0.5,
                    tile_overlap_distance=deserialized_data["tile_overlap_distance"]
                    if "tile_overlap_distance" in deserialized_data
                    else 0.15,
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
                            maxAngleChange=deserialized_data["max_angle_change"]
                            if "max_angle_change" in deserialized_data
                            else 15,
                            skewTolerance=deserialized_data["skew_tolerance"]
                            if "skew_tolerance" in deserialized_data
                            else 15,
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
            except Exception as ex:
                print(ex)
                return Response("Prediction Error", status=500)


@api_view(["POST"])
@decorators.authentication_classes([OsmAuthentication])
@decorators.permission_classes([IsOsmAuthenticated])
def publish_training(request, training_id: int):
    """Publishes training for model"""
    training_instance = get_object_or_404(Training, id=training_id)
    if training_instance.status != "FINISHED":
        return Response("Training is not FINISHED", status=404)
    if training_instance.accuracy < 70:
        return Response(
            "Can't publish the training since it's accuracy is below 70 %", status=404
        )
    model_instance = get_object_or_404(Model, id=training_instance.model.id)
    model_instance.published_training = training_instance.id
    model_instance.status = 0
    model_instance.save()
    return Response("Training Published", status=status.HTTP_201_CREATED)


class APIStatus(APIView):
    def get(self, request):
        res = {
            "tensorflow_version": tf.__version__,
            "No of GPU Available": len(
                tf.config.experimental.list_physical_devices("GPU")
            ),
            "API Status": "Healthy",  # static for now should be dynamic TODO
        }
        return Response(res, status=status.HTTP_200_OK)


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
    def get(self, request, lookup_dir=None):
        """List out status of training workspace : size in bytes"""
        # {workspace_dir:{file_name:{size:20,type:file},dir_name:{size:20,len:4,type:dir}}}
        base_dir = settings.TRAINING_WORKSPACE
        if lookup_dir:
            base_dir = os.path.join(base_dir, lookup_dir)
            if not os.path.exists(base_dir):
                return Response({"Errr:File/Dir not Found"}, status=404)
        data = {"file": {}, "dir": {}}
        if os.path.isdir(base_dir):
            for entry in os.scandir(base_dir):
                if entry.is_file():
                    data["file"][entry.name] = {
                        "size": entry.stat().st_size,
                    }
                elif entry.is_dir():
                    subdir_size = get_dir_size(entry.path)
                    data["dir"][entry.name] = {
                        "len": sum(1 for _ in os.scandir(entry.path)),
                        "size": subdir_size,
                    }
        elif os.path.isfile(base_dir):
            data["file"][os.path.basename(base_dir)] = {
                "size": os.path.getsize(base_dir)
            }

        return Response(data, status=status.HTTP_201_CREATED)


class TrainingWorkspaceDownloadView(APIView):
    # authentication_classes = [OsmAuthentication]
    # permission_classes = [IsOsmAuthenticated]

    def get(self, request, lookup_dir):
        base_dir = os.path.join(settings.TRAINING_WORKSPACE, lookup_dir)
        if not os.path.exists(base_dir):
            return Response({"Errr: File/Dir not found"}, status=404)
        size = (
            get_dir_size(base_dir)
            if os.path.isdir(base_dir)
            else os.path.getsize(base_dir)
        ) / (1024**2)
        if size > 200:  # if file is greater than 200 mb exit
            return Response(
                {f"Errr: File Size {size} MB Exceed More than 200 MB"}, status=403
            )

        if os.path.isfile(base_dir):
            response = FileResponse(open(base_dir, "rb"))
            response["Content-Disposition"] = 'attachment; filename="{}"'.format(
                os.path.basename(base_dir)
            )
            return response
        else:
            # TODO : This will take time to zip also based on the reading/writing speed of the dir
            temp = NamedTemporaryFile()
            shutil.make_archive(temp.name, "zip", base_dir)
            # rewind the file so it can be read from the beginning
            temp.seek(0)
            response = StreamingHttpResponse(
                open(temp.name + ".zip", "rb").read(), content_type="application/zip"
            )
            response["Content-Disposition"] = 'attachment; filename="{}.zip"'.format(
                os.path.basename(base_dir)
            )
            return response
