from __future__ import absolute_import

import json
import os
import pathlib
import shutil
import uuid
import zipfile
from datetime import datetime
from tempfile import NamedTemporaryFile

import tensorflow as tf
from celery import current_app
from celery.result import AsyncResult
from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from gpxpy.gpx import GPX, GPXTrack, GPXTrackSegment, GPXWaypoint
from hot_fair_utilities import polygonize, predict
from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated
from rest_framework import decorators, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter, TMSTileFilter

from .models import AOI, Dataset, Label, Model, Training
from .serializers import (
    AOISerializer,
    DatasetSerializer,
    ImageDownloadResponseSerializer,
    ImageDownloadSerializer,
    LabelFileSerializer,
    LabelSerializer,
    ModelSerializer,
    PredictionParamSerializer,
    TrainingSerializer,
)
from .utils import (
    bbox,
    download_imagery,
    get_dir_size,
    get_start_end_download_coords,
    process_rawdata,
    request_rawdata,
)


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


class ModelViewSet(
    viewsets.ModelViewSet
):  # This is ModelViewSet , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Model.objects.all()
    serializer_class = ModelSerializer  # connecting serializer


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


class RawdataApiView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    def post(self, request, aoi_id, *args, **kwargs):
        """Downloads available osm data as labels within given aoi

        Args:
            request (_type_): _description_
            aoi_id (_type_): _description_

        Returns:
            status: Success/Failed
        """
        obj = get_object_or_404(AOI, id=aoi_id)
        try:
            obj.download_status = 0
            obj.save()
            raw_data_params = {
                "geometry": json.loads(obj.geom.geojson),
                "filters": {"tags": {"polygon": {"building": []}}},
                "geometryType": ["polygon"],
            }
            result = request_rawdata(raw_data_params)
            file_download_url = result["download_url"]
            process_rawdata(file_download_url, aoi_id)
            obj.download_status = 1
            obj.last_fetched_date = datetime.utcnow()
            obj.save()
            return Response("Success", status=status.HTTP_201_CREATED)
        except Exception as ex:
            obj.download_status = -1
            obj.save()
            raise ex
            return Response("OSM Fetch Failed", status=500)


DEFAULT_TILE_SIZE = 256
DEFAULT_ZOOM_LEVEL = 19


class ImageDownloadView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]

    @swagger_auto_schema(
        request_body=ImageDownloadSerializer, responses={status.HTTP_200_OK: "ok"}
    )
    def post(self, request, *args, **kwargs):
        """Downloads the image for the dataset and creates labels.geojson from available labels inside dataset.
        Args:
            dataset_id: int - id of the dataset
            source : str - source url of OAM if present or any other URL - Optional
            zoom_level : list[int] - zoom level default is 19
        Returns:
            Download status
        """
        serializer = ImageDownloadSerializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            dataset_id = int(request.data.get("dataset_id"))
            # get source imagery url if supplied else use maxar

            source_img_in_dataset = get_object_or_404(
                Dataset, id=dataset_id
            ).source_imagery

            source = request.data.get(
                "source", source_img_in_dataset if source_img_in_dataset else "maxar"
            )
            zoom_level = list(request.data.get("zoom_level", [19]))

        # update the dataset if source imagery is supplied
        Dataset.objects.filter(id=dataset_id).update(source_imagery=source)

        # need to get all the aoi associated with dataset
        try:
            aois = AOI.objects.filter(dataset=dataset_id)
        except AOI.DoesNotExist:
            return Response(
                "No AOI is attached with supplied datastet id, Create AOI first",
                status=404,
            )
            # this is the base path where imagery will be downloaded if not present it
            # will create one
        base_path = os.path.join(
            settings.TRAINING_WORKSPACE, f"dataset_{dataset_id}", "input"
        )
        if os.path.exists(base_path):
            shutil.rmtree(base_path)
        os.makedirs(base_path)

        # looping through each of them and processing it one by one ,
        # later on we can specify each aoi to no of threads available
        for obj in aois:
            # TODO : Here assign each aoi to different thread as much as possible
            # and available
            if obj.imagery_status != 0:
                for z in zoom_level:
                    DEFAULT_ZOOM_LEVEL = int(z)
                    print(
                        f"""Running Download process for
                        aoi : {obj.id} - dataset : {dataset_id} , zoom : {DEFAULT_ZOOM_LEVEL}"""
                    )
                    obj.imagery_status = 0
                    obj.save()
                    tile_size = DEFAULT_TILE_SIZE  # by default
                    zm_level = DEFAULT_ZOOM_LEVEL
                    bbox_coords = bbox(obj.geom.coords[0])
                    start, end = get_start_end_download_coords(
                        bbox_coords, zm_level, tile_size
                    )
                    try:
                        # start downloading
                        download_imagery(
                            start,
                            end,
                            zm_level,
                            base_path=base_path,
                            source=source,
                        )

                        obj.imagery_status = 1
                        # obj.last_fetched_date = datetime.datetime.utcnow()
                        obj.save()

                    except Exception as ex:  # if download process is failed somehow
                        print(ex)
                        obj.imagery_status = -1  # not downloaded
                        # obj.last_fetched_date = datetime.datetime.utcnow()
                        obj.save()
            else:
                print(
                    f"""There is running process already for
                    : {obj.id} - dataset : {dataset_id} , Skippinggg"""
                )
        aoi = AOI.objects.filter(dataset=dataset_id).values()

        res_serializer = ImageDownloadResponseSerializer(data=list(aoi), many=True)

        aoi_list_queryset = AOI.objects.filter(dataset=dataset_id)

        aoi_list = [r.id for r in aoi_list_queryset]

        label = Label.objects.filter(aoi__in=aoi_list).values()
        serialized_field = LabelFileSerializer(data=list(label), many=True)
        try:
            if serialized_field.is_valid(raise_exception=True):
                with open(
                    os.path.join(base_path, "labels.geojson"), "w", encoding="utf-8"
                ) as f:
                    f.write(json.dumps(serialized_field.data))
                f.close()

        except Exception as ex:
            print(ex)
            raise ex
        print(f"Finished and avilable at : {base_path}")
        if res_serializer.is_valid(raise_exception=True):
            print(res_serializer.data)
            return Response(res_serializer.data, status=status.HTTP_201_CREATED)


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


@api_view(["GET"])
def run_task_status(request, run_id: str):
    """Gives the status of running task from background process

    Args:
        request (_type_): _description_
        run_id (_type_): _description_
    """
    task_result = AsyncResult(run_id, app=current_app)
    result = {
        "id": run_id,
        "status": task_result.state,
        "result": task_result.result if task_result.status == "SUCCESS" else None,
    }
    return Response(result)


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
            start, end = get_start_end_download_coords(
                bbox, zoom_level, DEFAULT_TILE_SIZE
            )
            temp_path = f"temp/{uuid.uuid4()}/"
            os.mkdir(temp_path)
            try:
                download_imagery(
                    start,
                    end,
                    zoom_level,
                    base_path=temp_path,
                    source=source,
                )
                prediction_output = f"{temp_path}/prediction/output"
                predict(
                    checkpoint_path=os.path.join(
                        settings.TRAINING_WORKSPACE,
                        f"dataset_{model_instance.dataset.id}",
                        "output",
                        f"training_{training_instance.id}",
                        "checkpoint.tf",
                    ),
                    input_path=temp_path,
                    prediction_path=prediction_output,
                )
                geojson_output = f"{prediction_output}/prediction.geojson"
                polygonize(
                    input_path=prediction_output,
                    output_path=geojson_output,
                    remove_inputs=True,
                )
                with open(geojson_output, "r") as f:
                    geojson_data = json.load(f)
                shutil.rmtree(temp_path)
                return Response(geojson_data, status=status.HTTP_201_CREATED)
            except Exception as ex:
                print(ex)
                shutil.rmtree(temp_path)
                return Response("Prediction Error", status=404)


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
        gpx = GPX()
        gpx_track = GPXTrack()
        gpx.tracks.append(gpx_track)
        gpx_segment = GPXTrackSegment()
        gpx_track.segments.append(gpx_segment)
        for point in geom_json["coordinates"][0]:
            # Append each point as a GPXWaypoint to the GPXTrackSegment
            gpx_segment.points.append(GPXWaypoint(point[1], point[0]))
        gpx.creator = "fAIr Backend"
        gpx_track.name = f"AOI of id {aoi_id} , Don't Edit this Boundary"
        gpx_track.description = "This is coming from AI Assisted Mapping - fAIr : HOTOSM , Map inside this boundary and go back to fAIr UI"
        gpx.time = datetime.now()
        gpx.link = "https://github.com/hotosm/fAIr"
        gpx.link_text = "AI Assisted Mapping - fAIr : HOTOSM"
        return HttpResponse(gpx.to_xml(), content_type="application/xml")


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
        if size > 500:  # if file is greater than 500 mb exit
            return Response(
                {f"Errr: File Size {size} MB Exceed More than 1024 MB"}, status=403
            )

        if os.path.isfile(base_dir):
            response = FileResponse(open(base_dir, "rb"))
            response["Content-Disposition"] = 'attachment; filename="{}"'.format(
                os.path.basename(base_dir)
            )
            return response
        else:
            temp = NamedTemporaryFile()
            shutil.make_archive(temp.name, "zip", base_dir)
            # rewind the file so it can be read from the beginning
            temp.seek(0)
            response = HttpResponse(
                open(temp.name + ".zip", "rb").read(), content_type="application/zip"
            )
            response["Content-Disposition"] = 'attachment; filename="{}.zip"'.format(
                os.path.basename(base_dir)
            )
            return response
