from django.conf import settings
from rest_framework import serializers
from rest_framework_gis.serializers import (
    GeoFeatureModelSerializer,  # this will be used if we used to serialize as geojson
)

from login.models import OsmUser

from .models import *

# from .tasks import train_model


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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsmUser
        fields = [
            "osm_id",
            "username",
            # "is_superuser",
            # "is_active",
            # "is_staff",
            "date_joined",
            # "email",
            "img_url",
            # "user_permissions",
        ]


class ModelSerializer(
    serializers.ModelSerializer
):  # serializers are used to translate models objects to api
    created_by = UserSerializer(read_only=True)
    accuracy = serializers.SerializerMethodField()

    class Meta:
        model = Model
        fields = "__all__"
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

    def get_accuracy(
        self, obj
    ):  ## this might have performance problem when db grows bigger , consider adding indexes / view in db
        training = Training.objects.filter(id=obj.published_training).first()
        if training:
            return training.accuracy
        return None


class ModelCentroidSerializer(GeoFeatureModelSerializer):
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = Model
        geo_field = "geometry"
        fields = ("id", "name", "geometry")

    def get_geometry(self, obj):
        """
        Get the centroid of the AOI linked to the dataset of the given model.
        """
        aoi = AOI.objects.filter(dataset=obj.dataset).first()
        if aoi and aoi.geom:
            return {
                "type": "Point",
                "coordinates": aoi.geom.centroid.coords,
            }
        return None

    def to_representation(self, instance):
        """
        Override to_representation to customize GeoJSON structure.
        """
        representation = super().to_representation(instance)
        representation["properties"]["id"] = representation.pop("id")
        return representation


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
            "label_fetched",
            "label_status",
        )


class FeedbackAOISerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FeedbackAOI
        geo_field = "geom"
        fields = "__all__"
        partial = True

        read_only_fields = (
            "created_at",
            "last_modified",
            "label_fetched",
            "label_status",
            "user",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)


class FeedbackSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Feedback
        geo_field = "geom"
        fields = "__all__"
        read_only_fields = ("created_at", "last_modified", "user")
        partial = True

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["properties"]["id"] = instance.id
        return ret


class LabelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Label
        geo_field = "geom"
        # auto_bbox = True
        fields = "__all__"

        # read_only_fields = ("created_at", "osm_id")


class ApprovedPredictionsSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ApprovedPredictions
        geo_field = "geom"
        fields = "__all__"


class FeedbackLabelSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FeedbackLabel
        geo_field = "geom"
        fields = "__all__"
        # read_only_fields = ("created_at", "osm_id")


class LabelFileSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Label
        geo_field = "geom"
        # auto_bbox = True
        fields = ("osm_id", "tags")


class FeedbackLabelFileSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FeedbackLabel
        geo_field = "geom"
        # auto_bbox = True
        fields = ("osm_id", "tags")


class FeedbackFileSerializer(GeoFeatureModelSerializer):
    class Meta:
        fields = ("training",)
        model = Feedback
        geo_field = "geom"


class ImageDownloadSerializer(serializers.Serializer):
    dataset_id = serializers.IntegerField(required=True)
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


class FeedbackParamSerializer(serializers.Serializer):
    training_id = serializers.IntegerField(required=True)
    epochs = serializers.IntegerField(required=False)
    batch_size = serializers.IntegerField(required=False)
    zoom_level = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate_training_id(self, value):
        try:
            Training.objects.get(id=value)
        except Training.DoesNotExist:
            raise serializers.ValidationError("Training doesn't exist")

        return value

    def validate(self, data):
        training_id = data.get("training_id")

        try:
            fd_aois = FeedbackAOI.objects.filter(training=training_id)
        except FeedbackAOI.DoesNotExist:
            raise serializers.ValidationError(
                "No feedback AOI is associated with Training"
            )

        if fd_aois.filter(
            label_status=FeedbackAOI.DownloadStatus.NOT_DOWNLOADED
        ).exists():
            raise serializers.ValidationError(
                "Not all AOIs have their labels downloaded"
            )

        if "epochs" in data and (
            data["epochs"] > settings.EPOCHS_LIMIT or data["epochs"] <= 0
        ):
            raise serializers.ValidationError(
                f"Epochs should be 1 - {settings.EPOCHS_LIMIT} on this server"
            )

        if "batch_size" in data and (
            data["batch_size"] > settings.BATCH_SIZE_LIMIT or data["batch_size"] <= 0
        ):
            raise serializers.ValidationError(
                f"Batch size should be 1 - {settings.BATCH_SIZE_LIMIT} on this server"
            )

        if "zoom_level" in data:
            for zoom in data["zoom_level"]:
                if zoom < 19 or zoom > 21:
                    raise serializers.ValidationError(
                        "Zoom level must be between 19 and 21"
                    )

        return data


class PredictionParamSerializer(serializers.Serializer):
    bbox = serializers.ListField(child=serializers.FloatField(), required=True)
    model_id = serializers.IntegerField(required=True)
    zoom_level = serializers.IntegerField(required=True)
    use_josm_q = serializers.BooleanField(required=False)
    source = serializers.URLField(required=False)
    # configs
    confidence = serializers.IntegerField(required=False)
    # for josm q
    max_angle_change = serializers.IntegerField(required=False)
    skew_tolerance = serializers.IntegerField(required=False)
    # for vectorization
    tolerance = serializers.FloatField(required=False)
    area_threshold = serializers.FloatField(required=False)
    tile_overlap_distance = serializers.FloatField(required=False)

    def validate_max_angle_change(self, value):
        if value is not None:
            if value < 0 or value > 45:
                raise serializers.ValidationError(
                    f"Invalid Max Angle Change: {value}, Should be between 0 and 45"
                )
        return value

    def validate_skew_tolerance(self, value):
        if value is not None:
            if value < 0 or value > 45:
                raise serializers.ValidationError(
                    f"Invalid Skew Tolerance: {value}, Should be between 0 and 45"
                )
        return value

    def validate_tolerance(self, value):
        if value is not None:
            if value < 0 or value > 10:
                raise serializers.ValidationError(
                    f"Invalid Tolerance: {value}, Should be between 0 and 10"
                )
        return value

    def validate_tile_overlap_distance(self, value):
        if value is not None:
            if value < 0 or value > 1:
                raise serializers.ValidationError(
                    f"Invalid Tile Overlap Distance : {value}, Should be between 0 and 1"
                )
        return value

    def validate_area_threshold(self, value):
        if value is not None:
            if value < 0 or value > 20:
                raise serializers.ValidationError(
                    f"Invalid Area Threshold: {value}, Should be between 0 and 20"
                )
        return value

    def validate(self, data):
        """
        Check supplied data
        """
        if "confidence" in data:
            if data["confidence"] < 0 or data["confidence"] > 100:
                raise serializers.ValidationError(
                    f"""Invalid Confidence threshold : {data["confidence"]}, Should be between 0-100"""
                )
        if len(data["bbox"]) != 4:
            raise serializers.ValidationError("Not a valid bbox")
        if data["zoom_level"] < 18 or data["zoom_level"] > 22:
            raise serializers.ValidationError(
                f"""Invalid Zoom level : {data["zoom_level"]}, Supported between 18-22"""
            )

        if "max_angle_change" in data:
            data["max_angle_change"] = self.validate_max_angle_change(
                data["max_angle_change"]
            )

        if "skew_tolerance" in data:
            data["skew_tolerance"] = self.validate_skew_tolerance(
                data["skew_tolerance"]
            )

        if "tolerance" in data:
            data["tolerance"] = self.validate_tolerance(data["tolerance"])

        if "area_threshold" in data:
            data["area_threshold"] = self.validate_area_threshold(
                data["area_threshold"]
            )
        return data
