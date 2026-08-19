from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from notifications.serializers import UserSerializer

from .models import Prediction

_MIN_ZOOM = 14
_MAX_ZOOM = 22


class PredictionSubmitSerializer(serializers.Serializer):
    model_stac_id = serializers.CharField(max_length=64)
    image_uri = serializers.URLField()
    bbox = serializers.ListField(
        child=serializers.FloatField(), min_length=4, max_length=4, required=False
    )
    geometry = serializers.JSONField(required=False)
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

    def validate_geometry(self, value):
        if not isinstance(value, dict) or value.get("type") not in ("Polygon", "MultiPolygon"):
            raise serializers.ValidationError("geometry must be a GeoJSON Polygon or MultiPolygon.")
        return value

    def validate(self, attrs):
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
            "geometry",
            "zoom",
            "params",
            "remove_osm",
            "visibility",
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
            "visibility",
            "user",
            "submitted_at",
            "last_polled_at",
        ]
