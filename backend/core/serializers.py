import mercantile
from django.conf import settings
from login.models import OsmUser
from rest_framework import serializers
from rest_framework_gis.serializers import (
    GeoFeatureModelSerializer,  # this will be used if we used to serialize as geojson
)

from .models import *

# from .tasks import train_model


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsmUser
        fields = [
            "osm_id",
            "username",
            # "is_superuser",
            # "is_active",
            # "is_staff",
            # "date_joined",
            # "email",
            # "img_url",
            # "user_permissions",
        ]

    read_only_fields = ["osm_id", "username"]


class DatasetSerializer(serializers.ModelSerializer):
    models_count = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = [
            "id",
            "name",
            "source_imagery",
            "last_modified",
            "created_at",
            "status",
            "models_count",
            "offset",
            "user",
        ]
        read_only_fields = (
            "user",
            "created_at",
            "last_modified",
            "models_count",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)

    def get_models_count(self, obj):
        return Model.objects.filter(
            dataset=obj, status=Model.ModelStatus.PUBLISHED
        ).count()

    def to_representation(self, instance):
        # get default
        ret = super().to_representation(instance)
        # For GET requests, replace the user field with detailed UserSerializer data
        if self.context.get("request") and self.context["request"].method == "GET":
            ret["user"] = UserSerializer(instance.user).data
        return ret


class ModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    accuracy = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Model
        fields = "__all__"
        read_only_fields = (
            "created_at",
            "last_modified",
            "user",
            "published_training",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)

    def __init__(self, *args, **kwargs):
        super(ModelSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        # Check if there's a pk in the URL (detail view) and then override dataset field.
        if (
            request
            and request.resolver_match
            and request.resolver_match.kwargs.get("pk")
        ):
            self.fields["dataset"] = DatasetSerializer(read_only=True)

    def get_thumbnail_url(self, obj):
        training = Training.objects.filter(id=obj.published_training).first()

        if training:
            if training.source_imagery:
                aoi = AOI.objects.filter(dataset=obj.dataset).first()
                if aoi and aoi.geom:
                    centroid = aoi.geom.centroid.coords  ## Centroid can be stored in db table if required when project grows bigger
                    try:
                        tile = mercantile.tile(centroid[0], centroid[1], zoom=18)
                        return training.source_imagery.format(x=tile.x, y=tile.y, z=18)
                    except Exception as ex:
                        pass
        return None

    def get_accuracy(self, obj):
        training = Training.objects.filter(id=obj.published_training).first()
        if training:
            return training.accuracy
        return None


class ModelCentroidSerializer(GeoFeatureModelSerializer):
    geometry = serializers.SerializerMethodField()
    mid = serializers.IntegerField(source="id")

    class Meta:
        model = Model
        geo_field = "geometry"
        fields = ("mid", "geometry")
        # fields = ("mid", "name", "geometry")

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


class DatasetCentroidSerializer(GeoFeatureModelSerializer):
    geometry = serializers.SerializerMethodField()
    did = serializers.IntegerField(source="id")

    class Meta:
        model = Dataset
        geo_field = "geometry"
        # fields = ("did", "geometry")
        fields = ("did", "name", "geometry")

    def get_geometry(self, obj):
        """
        Get the centroid of the AOI linked to the dataset of the given model.
        """
        aoi = AOI.objects.filter(dataset=obj.id).first()
        if aoi and aoi.geom:
            return {
                "type": "Point",
                "coordinates": aoi.geom.centroid.coords,
            }
        return None


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
            "user",
        )

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        return super().update(instance, validated_data)


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
    orthogonalize = serializers.BooleanField(required=False)
    source = serializers.URLField(required=False)
    # configs
    confidence = serializers.IntegerField(required=False)
    # for josm q
    ortho_max_angle_change_deg = serializers.IntegerField(required=False)
    ortho_skew_tolerance_deg = serializers.IntegerField(required=False)
    # for vectorization
    tolerance = serializers.FloatField(required=False)
    area_threshold = serializers.FloatField(required=False)
    tile_overlap_distance = serializers.FloatField(required=False)

    def validate_ortho_max_angle_change_deg(self, value):
        if value is not None:
            if value < 0 or value > 45:
                raise serializers.ValidationError(
                    f"Invalid Max Angle Change: {value}, Should be between 0 and 45"
                )
        return value

    def validate_ortho_skew_tolerance_deg(self, value):
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

        if "ortho_max_angle_change_deg" in data:
            data["ortho_max_angle_change_deg"] = self.validate_ortho_max_angle_change_deg(
                data["ortho_max_angle_change_deg"]
            )

        if "ortho_skew_tolerance_deg" in data:
            data["ortho_skew_tolerance_deg"] = self.validate_ortho_skew_tolerance_deg(
                data["ortho_skew_tolerance_deg"]
            )

        if "tolerance" in data:
            data["tolerance"] = self.validate_tolerance(data["tolerance"])

        if "area_threshold" in data:
            data["area_threshold"] = self.validate_area_threshold(
                data["area_threshold"]
            )
        return data


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = [
            "id",
            "message",
            "start_date",
            "end_date",
        ]


class UserStatsSerializer(serializers.ModelSerializer):
    models_count = serializers.SerializerMethodField()
    datasets_count = serializers.SerializerMethodField()
    feedbacks_count = serializers.SerializerMethodField()
    approved_predictions_count = serializers.SerializerMethodField()
    profile_completion_percentage = serializers.SerializerMethodField()
    unread_notifications_count = serializers.SerializerMethodField()

    class Meta:
        model = OsmUser
        fields = [
            "osm_id",
            "username",
            "email",
            "date_joined",
            "last_login",
            "email_verified",
            "img_url",
            "notifications_delivery_methods",
            "newsletter_subscription",
            "account_deletion_requested",
            "models_count",
            "datasets_count",
            "feedbacks_count",
            "approved_predictions_count",
            "profile_completion_percentage",
            "unread_notifications_count",
        ]
        read_only_fields = [
            "osm_id",
            "username",
            "date_joined",
            "img_url",
            "email_verified",
            "models_count",
            "datasets_count",
            "feedbacks_count",
            "approved_predictions_count",
            "profile_completion_percentage",
            "unread_notifications_count",
        ]

    def get_models_count(self, obj):
        return Model.objects.filter(user=obj).count()

    def get_datasets_count(self, obj):
        return Dataset.objects.filter(user=obj).count()

    def get_feedbacks_count(self, obj):
        return Feedback.objects.filter(user=obj, action="REJECT").count()

    def get_approved_predictions_count(self, obj):
        return Feedback.objects.filter(user=obj, action="ACCEPT").count()

    def get_profile_completion_percentage(self, obj):
        profile_percentage = 25
        if obj.img_url is not None and obj.img_url != "":
            profile_percentage += 25
        if obj.email is not None and obj.email != "":
            profile_percentage += 25
        if obj.email_verified:
            profile_percentage += 25
        return profile_percentage

    def get_unread_notifications_count(self, obj):
        return UserNotification.objects.filter(user=obj, is_read=False).count()


class UserNotificationSerializer(serializers.ModelSerializer):
    training_model = serializers.SerializerMethodField()

    class Meta:
        model = UserNotification
        fields = (
            "id",
            "is_read",
            "created_at",
            "read_at",
            "message",
            "related_object",
        )
        read_only_fields = (
            "id",
            "created_at",
            "read_at",
            "message",
            "related_object",
        )

    def get_related_object(self, obj):
        if obj.related_object:
            return {
                'id': obj.related_object.id,
                'type': type(obj.related_object).__name__,
                'model': obj.related_object.model if hasattr(obj.related_object, 'model') else None,
            }
        return None
