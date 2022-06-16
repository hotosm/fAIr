from xml.dom import ValidationErr
from django.shortcuts import render
from rest_framework import routers, serializers, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from django.shortcuts import render, get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import *
from .serializers import *
import requests

import json
import datetime
import os
from uuid import uuid4
from zipfile import ZipFile


class DatasetViewSet(viewsets.ModelViewSet): #This is datasetviewset , viewset is defined in order to perform curd efficiently and also this will be tightly coupled with the models 
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer # connecting serializer

class AOIViewSet(viewsets.ModelViewSet): 
    queryset = AOI.objects.all()
    serializer_class = AOISerializer # connecting serializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['dataset']

class LabelViewSet(viewsets.ModelViewSet): 
    queryset = Label.objects.all()
    serializer_class = LabelSerializer # connecting serializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['aoi']

class RawdataApiView(APIView):
    def get(self, request,aoi_id, *args, **kwargs):
        pass

    def post(self, request,aoi_id, *args, **kwargs):
        obj = AOI.objects.get(id=aoi_id)
        if not obj:
            return Response(
                {"res": "Object with Dataset id does not exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        obj.download_status = 0
        obj.save()
        raw_data_params={
            "geometry":json.loads(obj.geom.geojson),
            "filters":{"tags":{"polygon":{"building":[]}}},
            "geometryType":["polygon"]
        }
        result=request_rawdata(raw_data_params)
        file_download_url=result['download_url']
        process_rawdata(file_download_url,aoi_id)
        obj.download_status = 1
        obj.last_fetched_date = datetime.datetime.utcnow()
        obj.save()
        return Response("Success", status=status.HTTP_201_CREATED)


def request_rawdata(request_params):
    """This will make call to galaxy API get the databack and provides response as json

    Args:
        request_params (dict): Galaxy API Request Body

    Raises:
        ImportError: If galaxy url is not exists

    Returns:
        Response(json): API Response
    """
    try : 
        galaxy_url=os.environ.get('GALAXY_URL')
    except:
        raise ImportError(
                "Galaxy URL is not defined on env variable"
        )
    #following block should be a background task and api should deliver response quickly as possible
    headers = {'Content-type': "text/plain; charset=utf-8"}
    print(request_params)
    with requests.post(url = galaxy_url, data = json.dumps(request_params) ,headers=headers) as r : # no curl option , only request for now curl can be implemented when we see it's usage
        response_back = r.json()
        print(response_back)
        return response_back


def process_rawdata(file_download_url,aoi_id):
    """This will create temp directory , Downloads file from URL provided, Unzips it Finds a geojson file , Process it and finally removes proccessed Geojson file and downloaded zip file from Directory"""
    r = requests.get(file_download_url)
            # Check whether the export path exists or not
    path='temp/'
    isExist = os.path.exists(path)
    if not isExist:
        # Create a exports directory because it does not exist
        os.makedirs(path)
    file_temp_path=f"""{path}{str(uuid4())}.zip""" # making unique path each time when response is recieved -- being independent whatever the response is 
    open(file_temp_path, 'wb').write(r.content)
    print("Zip File from API wrote to disk")
    with ZipFile(file_temp_path, 'r') as zipObj:
        # Get a list of all archived file names from the zip
        listOfFileNames = zipObj.namelist()
        # Iterate over the file names
        geojson_file_path=f"""{path}/geojson/"""

        for fileName in listOfFileNames:
            # Check filename endswith csv
            if fileName.endswith('.geojson'):
                if fileName != "clipping_boundary.geojson":
                # Extract a single file from zip
                    zipObj.extract(fileName, geojson_file_path)
                    print(f"""Geojson file{fileName} from API wrote to disk""")
        geojson_file=f"""{geojson_file_path}{fileName}"""
        process_geojson(geojson_file,aoi_id)
    remove_file(file_temp_path)
    remove_file(geojson_file)


def remove_file(path: str) -> None:
    """Used for removing temp file
    """
    os.unlink(path)

def process_geojson(geojson_file_path,aoi_id):
    """Responsible for Processing Geojson file from directory , Opens the file reads the record , Checks either record present or not if not inserts into database

    Args:
        geojson_file_path (_type_): _description_
        aoi_id (_type_): _description_

    Raises:
        ValidationErr: _description_
    """
    print("Geojson Processing Started")

    with open(geojson_file_path) as f:
        data = json.load(f)
        for i in range(len(data["features"])):
            properties = data["features"][i]["properties"]
            osm_id=properties["osm_id"]
            geometry=data["features"][i]["geometry"]
            print(osm_id)
            try:
                go = Label.objects.get(osm_id=int(osm_id))
                print("already exists")
            except :
                label = LabelSerializer(data={'osm_id': int(osm_id),"geom":geometry,"aoi":aoi_id})
                if label.is_valid():
                    label.save()
                else:
                    raise ValidationErr(label.errors)
    print("writing to database finished")
            






