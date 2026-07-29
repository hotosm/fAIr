from typing import Any, cast

from rest_framework import serializers

from notifications.serializers import UserSerializer

from .models import BaseModel, Category, LocalModel


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "slug", "label", "description", "created_at", "last_modified"]
        read_only_fields = ["id", "created_at", "last_modified"]


class LocalModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    run_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = LocalModel
        fields = [
            "id",
            "name",
            "category",
            "stac_item_id",
            "status",
            "visibility",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "created_at",
            "last_modified",
        ]
        read_only_fields = [
            "id",
            "stac_item_id",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "created_at",
            "last_modified",
        ]


class BaseModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = BaseModel
        fields = [
            "id",
            "name",
            "category",
            "stac_item_id",
            "status",
            "visibility",
            "star_count",
            "is_starred",
            "error",
            "user",
            "created_at",
            "last_modified",
        ]
        read_only_fields = fields


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


class TrainingRunSummarySerializer(serializers.Serializer):
    """ZenML run summary, populated from fair.zenml.runs.RunSummary."""

    id = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    pipeline_name = serializers.CharField()
    model_name = serializers.CharField(allow_null=True)
    model_version = serializers.IntegerField(allow_null=True)
