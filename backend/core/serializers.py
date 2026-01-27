import mercantile
from django.conf import settings
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from login.models import OsmUser

from .models import (
    AOI,
    Banner,
    Dataset,
    Feedback,
    Label,
    Model,
    Prediction,
    Training,
    UserNotification,
)


class BaseModelSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        if hasattr(self.Meta.model, "user") and "user" not in validated_data:
            validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ModelMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Model
        fields = ["id", "name", "dataset", "base_model", "status"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsmUser
        fields = ["osm_id", "username"]
        read_only_fields = ["osm_id", "username"]


class DatasetSerializer(BaseModelSerializer):
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
        read_only_fields = ("user", "created_at", "last_modified", "models_count")
        swagger_schema_fields = {
            "example": {
                "name": "Building Detection Nepal",
                "source_imagery": "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
                "status": -1,
                "offset": [0.0, 0.0],
            }
        }

    # def validate_status(self, value):
    #     if self.instance is None and value != Dataset.DatasetStatus.DRAFT:
    #         raise serializers.ValidationError(
    #             "New datasets can only be created in DRAFT status. Update to ACTIVE or ARCHIVED after creation."
    #         )
    #     return value # fixme: this should be enabled but frontend needs to be in sync first 

    def get_models_count(self, obj):
        return Model.objects.filter(
            dataset=obj, status=Model.ModelStatus.PUBLISHED
        ).count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if self.context.get("request") and self.context["request"].method == "GET":
            ret["user"] = UserSerializer(instance.user).data
        return ret


class ModelSerializer(BaseModelSerializer):
    user = UserSerializer(read_only=True)
    accuracy = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Model
        fields = [
            "id",
            "dataset",
            "name",
            "created_at",
            "last_modified",
            "description",
            "user",
            "published_training",
            "status",
            "base_model",
            "accuracy",
            "thumbnail_url",
        ]
        read_only_fields = ("created_at", "last_modified", "user", "published_training")
        swagger_schema_fields = {
            "example": {
                "dataset": 1,
                "name": "YOLOv8 Building Model v1",
                "description": "Building detection model trained on Kathmandu imagery",
                "base_model": "YOLO_V8_V1",
                "status": -1,
            }
        }

    def __init__(self, *args, **kwargs):
        super(ModelSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if (
            request
            and request.resolver_match
            and request.resolver_match.kwargs.get("pk")
        ):
            self.fields["dataset"] = DatasetSerializer(read_only=True)

    def validate_status(self, value):
        if self.instance is None and value != Model.ModelStatus.DRAFT:
            raise serializers.ValidationError(
                "New models can only be created in DRAFT status. Update to PUBLISHED or ARCHIVED after creation."
            )
        return value

    def get_thumbnail_url(self, obj):
        training = Training.objects.filter(id=obj.published_training).first()

        if training:
            if training.source_imagery:
                aoi = AOI.objects.filter(dataset=obj.dataset).first()
                if aoi and aoi.geom:
                    centroid = aoi.geom.centroid.coords
                    try:
                        tile = mercantile.tile(centroid[0], centroid[1], zoom=18)
                        return training.source_imagery.format(x=tile.x, y=tile.y, z=18)
                    except Exception:
                        pass
        return None

    def get_accuracy(self, obj):
        training = Training.objects.filter(id=obj.published_training).first()
        if training:
            return training.accuracy
        return None


class BaseCentroidSerializer(GeoFeatureModelSerializer):
    geometry = serializers.SerializerMethodField()

    def get_aoi_centroid(self, dataset_id):
        """Common method to get AOI centroid for a dataset."""
        aoi = AOI.objects.filter(dataset=dataset_id).first()
        if aoi and aoi.geom:
            return {
                "type": "Point",
                "coordinates": aoi.geom.centroid.coords,
            }
        return None


class ModelCentroidSerializer(BaseCentroidSerializer):
    mid = serializers.IntegerField(source="id")

    class Meta:
        model = Model
        geo_field = "geometry"
        # id_field = "mid"
        fields = ("mid", "geometry")

    def get_geometry(self, obj):
        return self.get_aoi_centroid(obj.dataset.id)


class DatasetCentroidSerializer(BaseCentroidSerializer):
    did = serializers.IntegerField(source="id")

    class Meta:
        model = Dataset
        geo_field = "geometry"
        # id_field = "did"
        fields = ("did", "name", "geometry")

    def get_geometry(self, obj):
        return self.get_aoi_centroid(obj.id)


class AOISerializer(GeoFeatureModelSerializer):
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AOI
        geo_field = "geom"
        id_field = "id"
        fields = [
            "id",
            "dataset",
            "geom",
            "label_status",
            "label_fetched",
            "created_at",
            "last_modified",
            "user",
        ]
        read_only_fields = (
            "created_at",
            "last_modified",
            "label_fetched",
            "label_status",
            "user",
        )
        swagger_schema_fields = {
            "example": {
                "dataset": 1,
                "geom": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [85.3240, 27.7172],
                            [85.3250, 27.7172],
                            [85.3250, 27.7182],
                            [85.3240, 27.7182],
                            [85.3240, 27.7172],
                        ]
                    ],
                },
            }
        }

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


class LabelSerializer(GeoFeatureModelSerializer):
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Label
        geo_field = "geom"
        id_field = "id"
        fields = [
            "id",
            "aoi",
            "geom",
            "osm_id",
            "tags",
            "created_at",
        ]


class LabelFileSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Label
        geo_field = "geom"
        id_field = False
        fields = ("osm_id", "tags")


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
                from .exceptions import handle_validation_error

                raise handle_validation_error(
                    "zoom_level", "Zoom level must be between 19-21", i
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

    class Meta:
        swagger_schema_fields = {
            "example": {
                "bbox": [85.3240, 27.7172, 85.3250, 27.7182],
                "model_id": 1,
                "zoom_level": 20,
                "confidence": 50,
                "source": "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
            }
        }

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
            data["ortho_max_angle_change_deg"] = (
                self.validate_ortho_max_angle_change_deg(
                    data["ortho_max_angle_change_deg"]
                )
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
        swagger_schema_fields = {
            "example": {
                "message": "System maintenance scheduled for Dec 25, 2025",
                "start_date": "2025-12-25T00:00:00Z",
                "end_date": "2025-12-25T23:59:59Z",
            }
        }


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
    related_obj = serializers.SerializerMethodField()

    class Meta:
        model = UserNotification
        fields = (
            "id",
            "is_read",
            "created_at",
            "read_at",
            "message",
            "related_obj",
        )
        read_only_fields = (
            "id",
            "created_at",
            "read_at",
            "message",
            "related_obj",
        )

    def get_related_obj(self, obj):
        if obj.related_object:
            return {
                "id": obj.related_object.id,
                "type": type(obj.related_object).__name__,
                "model": (
                    obj.related_object.model.id
                    if hasattr(obj.related_object, "model")
                    else None
                ),
            }
        return None


class TrainingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    multimasks = serializers.BooleanField(required=False, default=False)
    input_contact_spacing = serializers.IntegerField(
        required=False, default=8, min_value=0, max_value=20
    )
    input_boundary_width = serializers.IntegerField(
        required=False, default=3, min_value=0, max_value=10
    )

    class Meta:
        model = Training
        fields = [
            "id",
            "model",
            "source_imagery",
            "description",
            "created_at",
            "status",
            "task_id",
            "zoom_level",
            "user",
            "started_at",
            "finished_at",
            "accuracy",
            "epochs",
            "chips_length",
            "batch_size",
            "freeze_layers",
            "centroid",
            "multimasks",
            "input_contact_spacing",
            "input_boundary_width",
        ]
        read_only_fields = (
            "created_at",
            "status",
            "user",
            "started_at",
            "finished_at",
            "accuracy",
        )
        swagger_schema_fields = {
            "example": {
                "model": 1,
                "description": "Training run with 50 epochs",
                "zoom_level": [18,19, 20],
                "epochs": 50,
                "batch_size": 8,
                "freeze_layers": False,
                "source_imagery": "https://tiles.openaerialmap.org/62dbd947dd564e0c8b63a91e/0/62dbd947dd564e0c8b63a91f/{z}/{x}/{y}.png",
                "multimasks": False,
                "input_contact_spacing": 8,
                "input_boundary_width": 3,
            }
        }

    def create(self, validated_data):
        import logging

        from django.shortcuts import get_object_or_404
        from rest_framework.exceptions import ValidationError

        from .models import AOI, Label
        from .tasks import train_model
        from .utils import validate_training_params

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
        zoom_level = validated_data["zoom_level"]
        validate_training_params(model, epochs, batch_size, zoom_level)

        user = self.context["request"].user
        validated_data["user"] = user

        multimasks = validated_data.get("multimasks", False)
        input_contact_spacing = validated_data.get("input_contact_spacing", 0.75)
        input_boundary_width = validated_data.get("input_boundary_width", 0.5)

        pop_keys = ["multimasks", "input_contact_spacing", "input_boundary_width"]
        for key in pop_keys:
            if key in validated_data.keys():
                validated_data.pop(key)

        instance = Training.objects.create(**validated_data)

        task = train_model.apply_async(
            kwargs={
                "dataset_id": instance.model.dataset.id,
                "training_id": instance.id,
                "epochs": instance.epochs,
                "batch_size": instance.batch_size,
                "zoom_level": instance.zoom_level,
                "source_imagery": instance.source_imagery
                or instance.model.dataset.source_imagery,
                "freeze_layers": instance.freeze_layers,
                "multimasks": multimasks,
                "input_contact_spacing": input_contact_spacing,
                "input_boundary_width": input_boundary_width,
            },
            queue=(
                "ramp_training"
                if instance.model.base_model == "RAMP"
                else "yolo_training"
            ),
        )
        logging.info("Record saved in queue")

        if not instance.source_imagery:
            instance.source_imagery = instance.model.dataset.source_imagery
        if multimasks:
            instance.description += f" Multimask params (ct/bw): {input_contact_spacing}/{input_boundary_width}"
        instance.task_id = task.id
        instance.save()
        logging.info(f"Training request queued with task ID {task.id}")
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.method.upper() == "GET":
            ret["model"] = ModelMetaSerializer(
                instance.model, context=self.context
            ).data
        return ret


class FeedbackSerializer(GeoFeatureModelSerializer, BaseModelSerializer):
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Feedback
        geo_field = "geom"
        id_field = "id"
        fields = [
            "id",
            "geom",
            "training",
            "action",
            "created_at",
            "config",
            "comments",
            "user",
        ]
        read_only_fields = ("created_at", "user")
        partial = True
        swagger_schema_fields = {
            "example": {
                "geom": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [85.3240, 27.7172],
                            [85.3250, 27.7172],
                            [85.3250, 27.7182],
                            [85.3240, 27.7182],
                            [85.3240, 27.7172],
                        ]
                    ],
                },
                "training": 1,
                "action": "ACCEPT",
                "comments": "Good detection",
                "config": {"confidence": 50},
            }
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["properties"]["id"] = instance.id
        return ret


class MapswipeProjectCreateSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    region = serializers.CharField(max_length=255)
    description = serializers.CharField()
    instruction = serializers.CharField()
    look_for = serializers.CharField(max_length=255, default="buildings")
    prediction_id = serializers.IntegerField(required=False)
    geojson_url = serializers.URLField()
    tms_url = serializers.URLField()
    cover_image = serializers.ImageField(required=False)
    
