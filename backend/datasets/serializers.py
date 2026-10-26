from django.conf import settings
from django.utils.http import MAX_URL_LENGTH
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from modelregistry.models import Category
from notifications.serializers import UserSerializer
from shared.integrations.stac import DATASETS_COLLECTION
from shared.serializers import (
    MAX_ZOOM,
    MIN_ZOOM,
    TMS_PLACEHOLDERS,
    StacFacetSerializer,
    imagery_from_shorthand,
    validate_input_imagery,
    validate_public_url,
)

from .label_sources import LABELS_URL_MAX_BYTES, LABELS_URL_TOTAL_SECONDS
from .models import AOI, Dataset


def _validate_tms_url(value: str) -> str:
    missing = [p for p in TMS_PLACEHOLDERS if p not in value]
    if missing:
        raise serializers.ValidationError(
            f"TMS URL must contain placeholders: {', '.join(missing)}"
        )
    return validate_public_url(value, ("http", "https"))


class DatasetCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    imagery = serializers.DictField(
        child=serializers.URLField(max_length=MAX_URL_LENGTH),
        required=False,
        allow_empty=False,
        help_text=(
            "TMS imagery for each model input, keyed by the input's name, e.g. "
            '{"post": "https://.../{z}/{x}/{y}", "pre": "https://.../{z}/{x}/{y}"}; a single-image '
            'model reads {"image": ...}. The first entry is the dataset\'s primary imagery, and '
            "the dataset keeps the tiles that every input has imagery for."
        ),
    )
    source_imagery = serializers.URLField(
        max_length=MAX_URL_LENGTH,
        required=False,
        help_text='Shorthand for imagery {"image": ...}; give either imagery or source_imagery.',
    )
    category = serializers.SlugRelatedField(slug_field="slug", queryset=Category.objects.all())
    zoom = serializers.IntegerField(min_value=MIN_ZOOM, max_value=MAX_ZOOM)
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
            '{"name": "amenity", "classes": ["hospital", "school"]}. '
            "With labels_url, name is a feature property and classes are its values."
        ),
    )
    labels_url = serializers.URLField(
        required=False,
        help_text=(
            "Public https URL of a GeoJSON FeatureCollection; when set, labels come from it and "
            "OSM is skipped. It is downloaded when the dataset builds, up to "
            f"{LABELS_URL_MAX_BYTES // 2**20} MB within {LABELS_URL_TOTAL_SECONDS} s, and a "
            "redirect fails the build. Features that intersect the AOIs and match geometry_type "
            "and label_classes are kept."
        ),
    )
    keywords = serializers.ListField(child=serializers.CharField(max_length=80), min_length=1)
    label_type = serializers.ChoiceField(choices=["vector", "raster"], default="vector")
    geometry_type = serializers.ChoiceField(
        choices=["point", "line", "polygon"],
        help_text=(
            "Geometry type of the labels, from OSM or labels_url. A dataset is "
            "single-geometry-type; mixing requires separate datasets."
        ),
    )

    def validate_source_imagery(self, value: str) -> str:
        return _validate_tms_url(value)

    def validate_imagery(self, value: dict[str, str]) -> dict[str, str]:
        return validate_input_imagery(value, _validate_tms_url)

    def validate_labels_url(self, value: str) -> str:
        return validate_public_url(value, ("https",))

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

    def validate(self, attrs: dict) -> dict:
        return imagery_from_shorthand(attrs, "source_imagery")


class DatasetAssetsSerializer(serializers.Serializer):
    chips = serializers.DictField(
        child=serializers.URLField(), help_text="Chips of each model input, by input name."
    )
    labels = serializers.URLField()


class DatasetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    stac_url = serializers.SerializerMethodField()
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    stac = serializers.SerializerMethodField()
    assets = serializers.SerializerMethodField()
    source_imagery = serializers.SerializerMethodField(help_text="Imagery of the primary input.")

    class Meta:
        model = Dataset
        fields = [
            "id",
            "stac_id",
            "title",
            "imagery",
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
            "imagery",
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

    def validate(self, attrs: dict) -> dict:
        if fixed := sorted({"imagery", "source_imagery"} & set(self.initial_data)):
            raise serializers.ValidationError(
                {name: "Imagery is set when the dataset is built." for name in fixed}
            )
        return attrs

    @extend_schema_field(OpenApiTypes.URI)
    def get_source_imagery(self, obj: Dataset) -> str:
        return obj.primary_imagery

    @extend_schema_field(DatasetAssetsSerializer(allow_null=True))
    def get_assets(self, obj: Dataset) -> dict[str, object] | None:
        if obj.status != Dataset.Status.BUILT:
            return None
        from shared.storage import StoragePaths, presigned_get_url

        stac_id = str(obj.stac_id)
        imagery: dict[str, str] = obj.imagery  # type: ignore[assignment]
        return {
            "labels": presigned_get_url(StoragePaths.dataset_labels_geojson_key(stac_id)),
            "chips": {
                name: presigned_get_url(StoragePaths.dataset_chips_dir_key(stac_id, name))
                for name in imagery
            },
        }


class AOISerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AOI
        geo_field = "geom"
        # Inline the pk in `properties` rather than the GeoJSON top-level "id"
        # so drf-spectacular's GIS extension can build the schema cleanly.
        id_field = False
        auto_bbox = False
        fields = ["id", "dataset", "geom", "user", "created_at", "last_modified"]
        read_only_fields = ["id", "user", "created_at", "last_modified"]
