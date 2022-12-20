from __future__ import absolute_import

import json
import os
import pathlib
import shutil
import zipfile
from datetime import datetime

from celery import current_app
from celery.result import AsyncResult
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter

from login.authentication import OsmAuthentication
from login.permissions import IsOsmAuthenticated

from .models import AOI, Dataset, Label, Model, Training
from .serializers import (
    AOISerializer,
    DatasetSerializer,
    ImageDownloadResponseSerializer,
    ImageDownloadSerializer,
    LabelFileSerializer,
    LabelSerializer,
    ModelSerializer,
    TrainingSerializer,
)
from .utils import bbox, download_imagery, latlng2tile, process_rawdata, request_rawdata


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
):  # This is datasetviewset , will be tightly coupled with the models
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsOsmAuthenticated]
    permission_allowed_methods = ["GET"]
    queryset = Training.objects.all()
    http_method_names = ["get", "post", "delete"]
    serializer_class = TrainingSerializer  # connecting serializer


class ModelViewSet(
    viewsets.ModelViewSet
):  # This is datasetviewset , will be tightly coupled with the models
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
        InBBoxFilter,
        DjangoFilterBackend,
    )  # it will take bbox like this api/v1/fetch-label/?in_bbox=-90,29,-89,35
    bbox_filter_include_overlapping = True  # Optional
    filterset_fields = ["aoi"]


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
        if get_object_or_404(AOI, dataset=dataset_id):

            aois = AOI.objects.filter(dataset=dataset_id)
            # this is the base path where imagery will be downloaded if not present it
            # will create one
        base_path = f"training/{dataset_id}"
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
                    bbox_coords = bbox(obj.geom.coords[0])
                    print(f"bbox is : {bbox_coords}")

                    tile_size = DEFAULT_TILE_SIZE  # by default
                    zm_level = DEFAULT_ZOOM_LEVEL

                    # start point where we will start downloading the tiles

                    start_point_lng = bbox_coords[0]  # getting the starting lat lng
                    start_point_lat = bbox_coords[1]

                    # end point where we should stop downloading the tile
                    end_point_lng = bbox_coords[2]  # getting the ending lat lng
                    end_point_lat = bbox_coords[3]

                    # Note :  lat=y-axis, lng=x-axis
                    # getting tile coordinate for first point of bbox
                    start_x, start_y = latlng2tile(
                        zoom=zm_level,
                        lat=start_point_lat,
                        lng=start_point_lng,
                        tile_size=tile_size,
                    )
                    start = [start_x, start_y]

                    # getting tile coordinate for last point of bbox
                    end_x, end_y = latlng2tile(
                        zoom=zm_level,
                        lat=end_point_lat,
                        lng=end_point_lng,
                        tile_size=tile_size,
                    )
                    end = [end_x, end_y]
                    try:
                        # start downloading
                        download_imagery(
                            start,
                            end,
                            zm_level,
                            dataset_id=dataset_id,
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
                    f"training/{dataset_id}/labels.geojson", "w", encoding="utf-8"
                ) as f:
                    f.write(json.dumps(serialized_field.data))
                f.close()

        except Exception as ex:
            print(ex)
            raise ex

        if res_serializer.is_valid(raise_exception=True):
            print(res_serializer.data)
            return Response(res_serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def download_training_data(request, dataset_id: int):
    """Used for Delivering our training folder to user.
    Returns zip file if it is present on our server if not returns error
    """

    file_path = f"training/{dataset_id}/"
    zip_temp_path = f"training/{dataset_id}.zip"
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
