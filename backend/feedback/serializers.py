import json
from typing import Any

from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from accounts.serializers import UserSerializer
from modelregistry.models import BaseModel, LocalModel

from .models import Feedback

CONFIG_MAX_BYTES = 4096


class FeedbackSerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Feedback
        geo_field = "geom"
        id_field = False
        auto_bbox = False
        fields = [
            "id",
            "stac_id",
            "geom",
            "action",
            "comments",
            "config",
            "user",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
        extra_kwargs = {"comments": {"max_length": 1000}}

    def validate_stac_id(self, value: str) -> str:
        if not (
            BaseModel.objects.filter(stac_item_id=value).exists()
            or LocalModel.objects.filter(stac_item_id=value).exists()
        ):
            raise serializers.ValidationError(f"No model has the STAC item id {value!r}.")
        return value

    def validate_config(self, value: Any) -> dict:
        if not isinstance(value, dict):
            raise serializers.ValidationError("config must be a JSON object.")
        size = len(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode())
        if size > CONFIG_MAX_BYTES:
            raise serializers.ValidationError(
                f"config must be at most {CONFIG_MAX_BYTES} bytes of JSON."
            )
        return value
