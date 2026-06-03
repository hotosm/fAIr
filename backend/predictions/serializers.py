from typing import Any

from drf_spectacular.utils import extend_schema_field
from pydantic import BaseModel, Field, ValidationError, model_validator
from rest_framework import serializers

from notifications.serializers import UserSerializer

from .models import Prediction

_MIN_ZOOM = 14
_MAX_ZOOM = 22


class _PredictInputSchema(BaseModel):
    """Mirrors the request shape served by fair-py-ops' Knative pipeline.

    the serve runtime in fair-py-ops uses the same field names and ranges so
    any model image trained today consumes the
    same input contract whether it serves via Knative or runs as a ZenML job.
    """

    image_uri: str = Field(min_length=1)
    bbox: list[float] = Field(min_length=4, max_length=4)
    zoom: int = Field(ge=_MIN_ZOOM, le=_MAX_ZOOM)
    params: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _check_bbox(self):
        west, south, east, north = self.bbox
        if west >= east or south >= north:
            raise ValueError("bbox must satisfy west<east and south<north")
        return self


class PredictionSubmitSerializer(serializers.Serializer):
    model_stac_id = serializers.CharField(max_length=64)
    image_uri = serializers.URLField()
    bbox = serializers.ListField(child=serializers.FloatField(), min_length=4, max_length=4)
    zoom = serializers.IntegerField(min_value=_MIN_ZOOM, max_value=_MAX_ZOOM)
    params = serializers.DictField(required=False, default=dict)
    remove_osm = serializers.BooleanField(
        required=False,
        default=False,
        help_text=(
            "If true, the post-run job subtracts existing OSM building footprints "
            "from the prediction set. Removed features are saved alongside the "
            "output as removed_osm.geojson."
        ),
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        try:
            _PredictInputSchema.model_validate(
                {
                    "image_uri": attrs["image_uri"],
                    "bbox": attrs["bbox"],
                    "zoom": attrs["zoom"],
                    "params": attrs.get("params", {}),
                }
            )
        except ValidationError as exc:
            raise serializers.ValidationError(exc.errors()) from exc
        return attrs


class PredictionResultSerializer(serializers.Serializer):
    """Presigned URLs for each materialized output format."""

    geojson = serializers.URLField()
    fgb = serializers.URLField()
    pmtiles = serializers.URLField()


class PredictionAssetsSerializer(serializers.Serializer):
    geojson = serializers.URLField()
    fgb = serializers.URLField()
    pmtiles = serializers.URLField()


class PredictionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assets = serializers.SerializerMethodField()

    @extend_schema_field(PredictionAssetsSerializer(allow_null=True))
    def get_assets(self, obj: Prediction) -> dict[str, str] | None:
        if not obj.results_ready:
            return None
        from shared.storage import StoragePaths, presigned_get_url

        out: dict[str, str] = {
            "geojson": presigned_get_url(StoragePaths.prediction_geojson_key(obj.id)),
            "fgb": presigned_get_url(StoragePaths.prediction_fgb_key(obj.id)),
            "pmtiles": presigned_get_url(StoragePaths.prediction_pmtiles_key(obj.id)),
        }
        return out

    class Meta:
        model = Prediction
        fields = [
            "id",
            "zenml_run_id",
            "local_model_stac_id",
            "image_uri",
            "bbox",
            "zoom",
            "params",
            "remove_osm",
            "is_public",
            "description",
            "status",
            "results_ready",
            "assets",
            "mapswipe_project_id",
            "user",
            "submitted_at",
            "last_polled_at",
        ]
        read_only_fields = [
            "id",
            "zenml_run_id",
            "status",
            "results_ready",
            "assets",
            "is_public",
            "user",
            "submitted_at",
            "last_polled_at",
        ]
