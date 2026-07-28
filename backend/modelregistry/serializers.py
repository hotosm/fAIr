from typing import Any, cast

from rest_framework import serializers

from notifications.serializers import UserSerializer
from shared.enums import ModelCategory

from .models import BaseModel, LocalModel


class LocalModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    run_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = LocalModel
        fields = [
            "id",
            "name",
            "category",
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
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "created_at",
            "last_modified",
        ]


class BaseModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BaseModel
        fields = [
            "id",
            "name",
            "category",
            "status",
            "visibility",
            "stac_item_url",
            "error",
            "user",
            "created_at",
            "last_modified",
        ]
        read_only_fields = fields


class BaseModelRegisterSerializer(serializers.Serializer):
    """Register a base model from an inline STAC item or a URL to one.

    Exactly one of ``stac_item`` (inline JSON) or ``stac_item_url`` (a link the
    catalog can fetch) must be supplied; the row stores whichever was given.
    """

    stac_item = serializers.JSONField(required=False)
    stac_item_url = serializers.URLField(required=False)
    category = serializers.ChoiceField(
        choices=ModelCategory.choices,
        default=ModelCategory.OTHER,
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


class BaseModelCategorySerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class TrainingRunSummarySerializer(serializers.Serializer):
    """ZenML run summary, populated from fair.zenml.runs.RunSummary."""

    id = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    pipeline_name = serializers.CharField()
    model_name = serializers.CharField(allow_null=True)
    model_version = serializers.IntegerField(allow_null=True)
