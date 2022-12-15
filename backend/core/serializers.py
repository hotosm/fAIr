from login.models import OsmUser
from rest_framework import serializers
from rest_framework_gis.serializers import (
    GeoFeatureModelSerializer,  # this will be used if we used to serialize as geojson
)

from .models import *


class DatasetSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Dataset
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want


class AOISerializer(
    GeoFeatureModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = AOI
        geo_field = "geom"  # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want


class LabelSerializer(
    GeoFeatureModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Label
        geo_field = "geom"  # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson
        # auto_bbox = True
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want


class LabelFileSerializer(
    GeoFeatureModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Label
        geo_field = "geom"  # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson
        # auto_bbox = True
        fields = (
            "osm_id",
        )  # defining all the fields to  be included in curd for now , we can restrict few if we want


class ImageDownloadSerializer(serializers.Serializer):
    dataset_id = serializers.IntegerField()
    source = serializers.URLField(required=False)
    zoom_level = serializers.ListField(required=False)

    def validate(self, data):
        """
        Check supplied data
        """
        for i in data["zoom_level"]:
            if int(i) < 19 or int(i) > 21:
                raise serializers.ValidationError("Zoom level Supported between 19-21")
        return data


class ImageDownloadResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AOI
        fields = (
            "id",
            "imagery_status",
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsmUser
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want
