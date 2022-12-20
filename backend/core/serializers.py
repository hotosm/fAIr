from rest_framework import serializers
from rest_framework_gis.serializers import (
    GeoFeatureModelSerializer,  # this will be used if we used to serialize as geojson
)

from login.models import OsmUser

from .models import *
from .tasks import train_model


class DatasetSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Dataset
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want
        read_only_fields = (
            "created_by",
            "created_at",
            "last_modified",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        return super().create(validated_data)


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
        user = self.context["request"].user
        validated_data["created_by"] = user
        # create the model instance
        instance = Training.objects.create(**validated_data)
        # run your function here
        train_model.delay(
            training_id=instance.id,
            epochs=instance.epochs,
            batch_size=instance.batch_size,
        )
        return instance


class ModelSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Model
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want
        read_only_fields = (
            "created_at",
            "last_modified",
            "created_by",
            "published_training",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        return super().create(validated_data)


class AOISerializer(
    GeoFeatureModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = AOI
        geo_field = "geom"  # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want

        read_only_fields = (
            "created_at",
            "last_modified",
            "last_fetched_date",
            "imagery_status",
            "download_status",
        )


class LabelSerializer(
    GeoFeatureModelSerializer
):  # serializers are used to translate models objects to api
    class Meta:
        model = Label
        geo_field = "geom"  # this will be used as geometry in order to create geojson api , geofeatureserializer will let you create api in geojson
        # auto_bbox = True
        fields = "__all__"  # defining all the fields to  be included in curd for now , we can restrict few if we want

        read_only_fields = (
            "created_at",
            "last_modified",
        )


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
    dataset_id = serializers.IntegerField(required=True)
    source = serializers.URLField(required=False)
    zoom_level = serializers.ListField(required=True)

    class Meta:
        fields = ("dataset_id", "source", "zoom_level")

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
        fields = [
            "osm_id",
            "username",
            "is_superuser",
            "is_active",
            "is_staff",
            "date_joined",
            "email",
            "img_url",
            "user_permissions",
        ]
