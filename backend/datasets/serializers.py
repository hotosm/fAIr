from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.utils.http import MAX_URL_LENGTH
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from fair.datasets import DEFAULT_CLASS_PROPERTY
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from accounts.serializers import UserSerializer
from modelregistry.models import Category
from shared.integrations.stac import DATASETS_COLLECTION
from shared.serializers import (
    MAX_ZOOM,
    MIN_ZOOM,
    TMS_PLACEHOLDERS,
    JSONFormDictField,
    JSONFormListField,
    OwnerOnlyErrorMixin,
    StacFacetSerializer,
    imagery_from_shorthand,
    validate_input_imagery,
    validate_public_url,
)

from .label_sources import (
    LABELS_MAX_BYTES,
    LABELS_URL_MAX_REDIRECTS,
    LABELS_URL_TOTAL_SECONDS,
    LabelsSourceError,
    parse_labels_geojson,
)
from .models import AOI, Dataset

# https://wiki.openstreetmap.org/wiki/Elements: keys and values are up to 255 characters.
OSM_TAG_MAX_LENGTH = 255


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
    imagery = JSONFormDictField(
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
    aoi_ids = JSONFormListField(child=serializers.IntegerField(), min_length=1)
    label_tasks = JSONFormListField(
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
    osm_tags = JSONFormDictField(
        child=serializers.ListField(
            child=serializers.CharField(max_length=OSM_TAG_MAX_LENGTH), min_length=1
        ),
        required=False,
        allow_empty=False,
        help_text=(
            'OSM tags for the labels, e.g. {"building": ["*"]}. Give one of osm_tags, '
            "labels_file or labels_url."
        ),
    )
    labels_file = serializers.FileField(
        required=False,
        help_text=(
            f"GeoJSON FeatureCollection upload, up to {LABELS_MAX_BYTES // 2**20} MB, sent as "
            "multipart/form-data; each feature names its class in class_property."
        ),
    )
    labels_url = serializers.URLField(
        required=False,
        help_text=(
            "Public https URL of a GeoJSON FeatureCollection; each feature names its class in "
            "class_property. It is downloaded when the dataset builds, up to "
            f"{LABELS_MAX_BYTES // 2**20} MB within {LABELS_URL_TOTAL_SECONDS} s, following up "
            f"to {LABELS_URL_MAX_REDIRECTS} redirects to other public https URLs."
        ),
    )
    class_property = serializers.CharField(
        required=False,
        max_length=200,
        help_text=(f'Feature property holding the class (default "{DEFAULT_CLASS_PROPERTY}").'),
    )
    keywords = JSONFormListField(child=serializers.CharField(max_length=80), min_length=1)
    label_type = serializers.ChoiceField(choices=["vector", "raster"], default="vector")
    geometry_type = serializers.ChoiceField(
        choices=["point", "line", "polygon"],
        help_text=(
            "Geometry type of the labels. A dataset is "
            "single-geometry-type; mixing requires separate datasets."
        ),
    )

    def validate_source_imagery(self, value: str) -> str:
        return _validate_tms_url(value)

    def validate_imagery(self, value: dict[str, str]) -> dict[str, str]:
        return validate_input_imagery(value, _validate_tms_url)

    def validate_osm_tags(self, value: dict[str, list[str]]) -> dict[str, list[str]]:
        if invalid := [key for key in value if not key.strip() or len(key) > OSM_TAG_MAX_LENGTH]:
            raise serializers.ValidationError(
                f"OSM keys must be 1 to {OSM_TAG_MAX_LENGTH} characters, got {invalid}"
            )
        return value

    def validate_labels_url(self, value: str) -> str:
        return validate_public_url(value, ("https",))

    def validate_labels_file(self, value: UploadedFile) -> UploadedFile:
        if value.size is None or value.size > LABELS_MAX_BYTES:
            raise serializers.ValidationError(
                f"labels_file is larger than {LABELS_MAX_BYTES} bytes"
            )
        try:
            parse_labels_geojson(value.read())
        except LabelsSourceError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return value

    def validate(self, attrs: dict) -> dict:
        sources = [name for name in ("osm_tags", "labels_file", "labels_url") if name in attrs]
        if len(sources) != 1:
            raise serializers.ValidationError(
                {"osm_tags": ["Give exactly one of osm_tags, labels_file or labels_url."]}
            )
        if "osm_tags" in attrs and "class_property" in attrs:
            raise serializers.ValidationError(
                {
                    "class_property": [
                        "class_property names a property of labels_file or labels_url."
                    ]
                }
            )
        attrs.setdefault("class_property", DEFAULT_CLASS_PROPERTY)
        return imagery_from_shorthand(attrs, "source_imagery")


class DatasetAssetsSerializer(serializers.Serializer):
    chips = serializers.DictField(
        child=serializers.URLField(), help_text="Chips of each model input, by input name."
    )
    labels = serializers.URLField()


class DatasetSerializer(OwnerOnlyErrorMixin, serializers.ModelSerializer):
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
            "error",
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
            "error",
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
