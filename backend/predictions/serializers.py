from django.utils.http import MAX_URL_LENGTH
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from notifications.serializers import UserSerializer
from shared.serializers import (
    MAX_ZOOM,
    MIN_ZOOM,
    OwnerOnlyErrorMixin,
    imagery_from_shorthand,
    validate_input_imagery,
    validate_public_url,
)

from .models import Prediction


class PredictionSubmitSerializer(serializers.Serializer):
    model_stac_id = serializers.CharField(max_length=64)
    imagery = serializers.DictField(
        child=serializers.URLField(max_length=MAX_URL_LENGTH),
        required=False,
        allow_empty=False,
        help_text=(
            "Imagery for each model input, keyed by the input's name, e.g. "
            '{"post": "https://.../{z}/{x}/{y}", "pre": "https://.../{z}/{x}/{y}"}; a single-image '
            'model reads {"image": ...}. Each is a TMS template or a TileJSON URL, and the '
            "prediction keeps the tiles that every input has imagery for."
        ),
    )
    image_uri = serializers.URLField(
        max_length=MAX_URL_LENGTH,
        required=False,
        help_text='Shorthand for imagery {"image": ...}; give either imagery or image_uri.',
    )
    bbox = serializers.ListField(
        child=serializers.FloatField(), min_length=4, max_length=4, required=False
    )
    geometry = serializers.JSONField(required=False)
    zoom = serializers.IntegerField(min_value=MIN_ZOOM, max_value=MAX_ZOOM)
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

    def validate_image_uri(self, value: str) -> str:
        return validate_public_url(value, ("http", "https"))

    def validate_imagery(self, value: dict[str, str]) -> dict[str, str]:
        return validate_input_imagery(
            value, lambda url: validate_public_url(url, ("http", "https"))
        )

    def validate_geometry(self, value):
        if not isinstance(value, dict) or value.get("type") not in ("Polygon", "MultiPolygon"):
            raise serializers.ValidationError("geometry must be a GeoJSON Polygon or MultiPolygon.")
        return value

    def validate(self, attrs):
        attrs = imagery_from_shorthand(attrs, "image_uri")
        bbox = attrs.pop("bbox", None)
        geometry = attrs.get("geometry")
        if bool(bbox) == bool(geometry):
            raise serializers.ValidationError("Provide exactly one of 'bbox' or 'geometry'.")
        if bbox:
            west, south, east, north = bbox
            if west >= east or south >= north:
                raise serializers.ValidationError(
                    {"bbox": "bbox must satisfy west<east and south<north"}
                )
            attrs["geometry"] = {
                "type": "Polygon",
                "coordinates": [
                    [[west, south], [east, south], [east, north], [west, north], [west, south]]
                ],
            }
        else:
            from shapely.errors import GEOSException
            from shapely.geometry import shape

            try:
                shape(geometry)
            except (ValueError, KeyError, TypeError, GEOSException) as exc:
                raise serializers.ValidationError({"geometry": f"invalid geometry: {exc}"}) from exc
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


class PredictionSerializer(OwnerOnlyErrorMixin, serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.CharField(
        read_only=True, allow_null=True, help_text="Category slug of the model that ran."
    )
    model_name = serializers.CharField(
        read_only=True, allow_null=True, help_text="Registered name of the model that ran."
    )
    assets = serializers.SerializerMethodField()
    image_uri = serializers.SerializerMethodField(help_text="Imagery of the model's first input.")

    @extend_schema_field(OpenApiTypes.URI)
    def get_image_uri(self, obj: Prediction) -> str:
        return obj.primary_imagery

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
            "model_name",
            "category",
            "imagery",
            "image_uri",
            "geometry",
            "zoom",
            "params",
            "remove_osm",
            "visibility",
            "description",
            "status",
            "error",
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
            "imagery",
            "model_name",
            "category",
            "status",
            "error",
            "results_ready",
            "assets",
            "visibility",
            "user",
            "submitted_at",
            "last_polled_at",
        ]
