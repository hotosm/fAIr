from typing import Any, cast

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from notifications.serializers import UserSerializer
from shared.integrations.stac import BASE_MODELS_COLLECTION, LOCAL_MODELS_COLLECTION
from shared.serializers import StacFacetSerializer

from .models import BaseModel, Category, LocalModel


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "slug", "label", "description", "created_at", "last_modified"]
        read_only_fields = ["id", "created_at", "last_modified"]


class LocalModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    base_model = serializers.PrimaryKeyRelatedField(read_only=True)
    base_model_name = serializers.CharField(source="base_model.name", read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    run_count = serializers.IntegerField(read_only=True, default=0)
    stac = serializers.SerializerMethodField()

    class Meta:
        model = LocalModel
        fields = [
            "id",
            "name",
            "category",
            "base_model",
            "base_model_name",
            "stac_item_id",
            "status",
            "visibility",
            "is_pinned",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "stac",
            "created_at",
            "last_modified",
        ]
        read_only_fields = [
            "id",
            "base_model",
            "base_model_name",
            "stac_item_id",
            "is_pinned",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "stac",
            "created_at",
            "last_modified",
        ]

    @extend_schema_field(StacFacetSerializer(allow_null=True))
    def get_stac(self, obj: LocalModel) -> dict | None:
        items = self.context.get("stac_items_by_id") or {}
        return items.get((LOCAL_MODELS_COLLECTION, obj.stac_item_id))


class BaseModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    stac = serializers.SerializerMethodField()

    class Meta:
        model = BaseModel
        fields = [
            "id",
            "name",
            "category",
            "stac_item_id",
            "status",
            "visibility",
            "is_pinned",
            "star_count",
            "is_starred",
            "error",
            "user",
            "stac",
            "created_at",
            "last_modified",
        ]
        read_only_fields = fields

    @extend_schema_field(StacFacetSerializer(allow_null=True))
    def get_stac(self, obj: BaseModel) -> dict | None:
        items = self.context.get("stac_items_by_id") or {}
        return items.get((BASE_MODELS_COLLECTION, obj.stac_item_id))


class BaseModelRegisterSerializer(serializers.Serializer):
    """Register a base model from an inline STAC item or a URL to one.

    Exactly one of ``stac_item`` (inline JSON) or ``stac_item_url`` (a link
    fetched at request time) must be supplied. Either way the resolved item is
    stored in ``stac_item``; the URL itself is not persisted.

    ``inference_endpoint`` is optional: when given, its URL is written to the
    item's ``mlm:inference-endpoint`` asset before registration; when omitted,
    whatever the STAC item already carries is used unchanged.
    """

    stac_item = serializers.JSONField(required=False)
    stac_item_url = serializers.URLField(required=False)
    inference_endpoint = serializers.URLField(required=False)
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all(),
        required=False,
    )

    def validate_stac_item(self, value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise serializers.ValidationError("stac_item must be a JSON object.")
        item = cast("dict[str, Any]", value)
        properties = item.get("properties")
        name = (
            cast("dict[str, Any]", properties).get("mlm:name")
            if isinstance(properties, dict)
            else None
        )
        if not name:
            raise serializers.ValidationError("stac_item.properties['mlm:name'] is required.")
        return item

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if bool(attrs.get("stac_item")) == bool(attrs.get("stac_item_url")):
            raise serializers.ValidationError(
                "Provide exactly one of 'stac_item' or 'stac_item_url'."
            )
        return attrs


class ModelPinSerializer(serializers.Serializer):
    """Pin/unpin a model. `is_pinned` flips the DB flag; when supplied,
    `source_imagery` (a TMS template) and `pinned_location` (a GeoJSON Point)
    are written onto the model's STAC item as `fair:source_imagery` and
    `fair:preview_location`."""

    _TMS_PLACEHOLDERS = ("{x}", "{y}", "{z}")

    is_pinned = serializers.BooleanField(default=True)
    source_imagery = serializers.CharField(required=False, allow_blank=True, default="")
    pinned_location = serializers.JSONField(required=False)

    def validate_source_imagery(self, value: str) -> str:
        if value and any(p not in value for p in self._TMS_PLACEHOLDERS):
            raise serializers.ValidationError(
                f"source_imagery must contain placeholders: {', '.join(self._TMS_PLACEHOLDERS)}"
            )
        return value

    def validate_pinned_location(self, value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise serializers.ValidationError("pinned_location must be a GeoJSON Point.")
        location = cast("dict[str, Any]", value)
        if location.get("type") != "Point":
            raise serializers.ValidationError("pinned_location must be a GeoJSON Point.")
        coordinates = location.get("coordinates")
        if not (isinstance(coordinates, list) and len(coordinates) == 2):
            raise serializers.ValidationError("Point coordinates must be [lon, lat].")
        return location


class ModelMetadataSerializer(serializers.Serializer):
    """Edit a published model's STAC metadata. Any supplied field is written to the
    item; the merged item is then re-validated against the fAIr schema before it is saved."""

    title = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    fair_preview = serializers.JSONField(required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError(
                "Provide at least one of: title, description, fair_preview."
            )
        return attrs


class TrainingRunSummarySerializer(serializers.Serializer):
    """ZenML run summary, populated from fair.zenml.runs.RunSummary."""

    id = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    pipeline_name = serializers.CharField()
    model_name = serializers.CharField(allow_null=True)
    model_version = serializers.IntegerField(allow_null=True)
