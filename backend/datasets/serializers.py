from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from modelregistry.models import Category
from notifications.serializers import UserSerializer
from shared.integrations.stac import DATASETS_COLLECTION
from shared.serializers import StacFacetSerializer

from .models import AOI, Dataset

_TMS_PLACEHOLDERS = ("{x}", "{y}", "{z}")


def _validate_tms_url(value: str) -> str:
    missing = [p for p in _TMS_PLACEHOLDERS if p not in value]
    if missing:
        raise serializers.ValidationError(
            f"TMS URL must contain placeholders: {', '.join(missing)}"
        )
    return value


class DatasetCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    source_imagery = serializers.URLField()
    category = serializers.SlugRelatedField(slug_field="slug", queryset=Category.objects.all())
    zoom = serializers.IntegerField(min_value=14, max_value=22)
    aoi_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    label_tasks = serializers.ListField(
        child=serializers.ChoiceField(
            choices=[
                "semantic-segmentation",
                "instance-segmentation",
                "object-detection",
                "classification",
            ]
        ),
        min_length=1,
    )
    label_classes = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        help_text=(
            'Each entry: {"name": OSM tag key, "classes": list of OSM tag '
            'values OR ["*"] for any value}. e.g. '
            '{"name": "building", "classes": ["yes"]} or '
            '{"name": "amenity", "classes": ["hospital", "school"]}.'
        ),
    )
    keywords = serializers.ListField(child=serializers.CharField(max_length=80), min_length=1)
    label_type = serializers.ChoiceField(choices=["vector", "raster"], default="vector")
    geometry_type = serializers.ChoiceField(
        choices=["point", "line", "polygon"],
        help_text=(
            "OSM geometry bucket to fetch labels from. A dataset is "
            "single-geometry-type; mixing requires separate datasets."
        ),
    )

    def validate_source_imagery(self, value: str) -> str:
        return _validate_tms_url(value)

    def validate_label_classes(self, value: list[dict]) -> list[dict]:
        for index, cls in enumerate(value):
            if "name" not in cls or not cls["name"]:
                raise serializers.ValidationError(
                    f"label_classes[{index}] must include a non-empty 'name'"
                )
            classes = cls.get("classes")
            if not isinstance(classes, list) or not classes:
                raise serializers.ValidationError(
                    f"label_classes[{index}] must include a non-empty 'classes' list "
                    '(use ["*"] for any value, or specific OSM tag values like ["yes"])'
                )
        return value


class DatasetAssetsSerializer(serializers.Serializer):
    chips = serializers.URLField()
    labels = serializers.URLField()


class DatasetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    stac_url = serializers.SerializerMethodField()
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    stac = serializers.SerializerMethodField()
    assets = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = [
            "id",
            "stac_id",
            "title",
            "source_imagery",
            "category",
            "status",
            "visibility",
            "stac_url",
            "user",
            "star_count",
            "is_starred",
            "stac",
            "assets",
            "created_at",
            "last_modified",
        ]
        read_only_fields = [
            "id",
            "stac_id",
            "status",
            "visibility",
            "stac_url",
            "user",
            "star_count",
            "is_starred",
            "stac",
            "assets",
            "created_at",
            "last_modified",
        ]

    def get_stac_url(self, obj: Dataset) -> str:
        return f"{settings.FAIR_STAC_API_URL}/collections/{DATASETS_COLLECTION}/items/{obj.stac_id}"

    @extend_schema_field(StacFacetSerializer(allow_null=True))
    def get_stac(self, obj: Dataset) -> dict | None:
        items = self.context.get("stac_items_by_id") or {}
        return items.get((DATASETS_COLLECTION, obj.stac_id))

    @extend_schema_field(DatasetAssetsSerializer(allow_null=True))
    def get_assets(self, obj: Dataset) -> dict[str, str] | None:
        if obj.status != Dataset.Status.BUILT:
            return None
        from shared.storage import StoragePaths, presigned_get_url

        stac_id = str(obj.stac_id)
        return {
            "chips": presigned_get_url(StoragePaths.dataset_chips_dir_key(stac_id)),
            "labels": presigned_get_url(StoragePaths.dataset_labels_geojson_key(stac_id)),
        }


class AOISerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)
    area = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_area(self, obj: AOI) -> float:
        """Area in square meters, via a global equal-area projection (EPSG:6933).

        obj.geom is stored in SRID 4326 (WGS84 degrees) and is also used
        as-is for the feature's `geom` output, so transform on a clone --
        transforming in place would corrupt the geometry in the response.
        """
        equal_area_geom = obj.geom.transform(6933, clone=True)
        return round(equal_area_geom.area, 2)

    class Meta:
        model = AOI
        geo_field = "geom"
        # Inline the pk in `properties` rather than the GeoJSON top-level "id"
        # so drf-spectacular's GIS extension can build the schema cleanly.
        id_field = False
        auto_bbox = True
        fields = ["id", "dataset", "geom", "area", "user", "created_at", "last_modified"]
        read_only_fields = ["id", "area", "user", "created_at", "last_modified"]
