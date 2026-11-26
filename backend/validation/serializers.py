import re

from fair.stac.label_classes import LabelClassError, class_key, dataset_classes
from rest_framework import serializers

from accounts.permissions import is_admin
from accounts.serializers import UserSerializer
from datasets.models import Dataset
from predictions.models import Prediction
from shared.enums import DatasetStatus, ValidationStatus, ValidationType, Visibility
from shared.integrations.stac import get_dataset

from .models import ValidationProject

ANSWERS_PER_REQUEST = 50
MAX_SOURCES = 5
# pmtiles' tileid_to_zxy raises OverflowError past the last zoom-31 tile id.
MAX_TILE_ID = (4**32 - 1) // 3 - 1
_NEXT_STATUS = {
    ValidationStatus.DRAFT: ValidationStatus.PUBLISHED,
    ValidationStatus.PUBLISHED: ValidationStatus.FINISHED,
}


def project_source(project_type: str, source_id: str) -> Dataset | Prediction | None:
    if project_type == ValidationType.TRAINING:
        return Dataset.objects.filter(stac_id=source_id, status=DatasetStatus.BUILT).first()
    if not re.fullmatch(r"[0-9]+", source_id):
        return None
    return Prediction.objects.filter(id=int(source_id), results_ready=True).first()


def all_sources_public(project: ValidationProject) -> bool:
    kind = str(project.type)
    source_ids: list[str] = project.source_ids  # type: ignore[assignment]
    sources = [project_source(kind, source_id) for source_id in source_ids]
    return all(source is not None and source.visibility == Visibility.PUBLIC for source in sources)


class ValidationProjectSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    source_ids = serializers.ListField(
        child=serializers.CharField(max_length=200),
        min_length=1,
        max_length=MAX_SOURCES,
        help_text="Dataset STAC ids on the same imagery, or one prediction id.",
    )
    class_map = serializers.DictField(
        child=serializers.CharField(max_length=200),
        required=False,
        default=dict,
        help_text=(
            'Dataset classes ("property=value") merged into the class shown on tiles, '
            'e.g. {"roof:material=metal_sheet": "metal"}. Set at creation.'
        ),
    )
    respondent_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Accounts and distinct guest ids that answered."
    )

    class Meta:
        model = ValidationProject
        fields = [
            "id",
            "slug",
            "source_ids",
            "type",
            "class_map",
            "title",
            "description",
            "answers_needed",
            "status",
            "build_status",
            "build_error",
            "build_requested_at",
            "user",
            "created_at",
            "respondent_count",
        ]
        read_only_fields = [
            "id",
            "slug",
            "build_status",
            "build_error",
            "build_requested_at",
            "user",
            "created_at",
        ]

    def update(self, instance: ValidationProject, validated_data: dict) -> ValidationProject:
        # A full save would write back a build status the worker changed during this request.
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(validated_data))
        return instance

    def _check_sources(self, attrs: dict) -> None:
        source_ids: list[str] = attrs["source_ids"]
        kind = attrs["type"]
        if kind == ValidationType.PREDICTION and len(source_ids) != 1:
            raise serializers.ValidationError(
                {"source_ids": "A prediction project has one source."}
            )
        if len(set(source_ids)) != len(source_ids):
            raise serializers.ValidationError({"source_ids": "List each source once."})
        user = self.context["request"].user
        first: Dataset | Prediction | None = None
        for source_id in source_ids:
            source = project_source(kind, source_id)
            if source is None:
                raise serializers.ValidationError(
                    {"source_ids": f"No built dataset or finished prediction with id {source_id}."}
                )
            if source.user != user and not is_admin(user):
                raise serializers.ValidationError(
                    {"source_ids": f"Only its owner or an admin can validate {source_id}."}
                )
            imagery: dict[str, str] = source.imagery  # type: ignore[assignment]
            if len(imagery) != 1:
                raise serializers.ValidationError(
                    {"source_ids": "Only sources with one imagery input can be validated."}
                )
            if isinstance(source, Prediction) and not source.feature_count:
                raise serializers.ValidationError({"source_ids": "This prediction found nothing."})
            if first is not None and source.imagery != first.imagery:
                raise serializers.ValidationError(
                    {"source_ids": f"{source_id} uses other imagery or input than {source_ids[0]}."}
                )
            first = first or source

    def _check_class_map(self, attrs: dict) -> None:
        class_map: dict[str, str] = attrs.get("class_map", {})
        if not class_map:
            return
        if attrs["type"] != ValidationType.TRAINING:
            raise serializers.ValidationError(
                {"class_map": "Only a training project can merge classes."}
            )
        declared: set[str] = set()
        for source_id in attrs["source_ids"]:
            try:
                declared |= {
                    class_key(*pair) for pair in dataset_classes(get_dataset(source_id).properties)
                }
            except LabelClassError as error:
                raise serializers.ValidationError({"class_map": f"{source_id}: {error}"}) from error
        if unknown := sorted(set(class_map) - declared):
            raise serializers.ValidationError(
                {"class_map": f"No source declares {unknown}; keys look like property=value."}
            )

    def validate(self, attrs: dict) -> dict:
        if self.instance is None:
            if attrs.get("status", ValidationStatus.DRAFT) != ValidationStatus.DRAFT:
                raise serializers.ValidationError({"status": "A new project starts as a draft."})
            self._check_sources(attrs)
            self._check_class_map(attrs)
            return attrs
        if self.instance.status == ValidationStatus.FINISHED:
            raise serializers.ValidationError({"status": "A finished project cannot change."})
        for field in ("source_ids", "type", "class_map"):
            if field in attrs and attrs[field] != getattr(self.instance, field):
                raise serializers.ValidationError({field: "Cannot change after creation."})
        status = attrs.get("status", self.instance.status)
        if status != self.instance.status and _NEXT_STATUS.get(self.instance.status) != status:
            raise serializers.ValidationError(
                {"status": f"Cannot move from {self.instance.status} to {status}."}
            )
        publishing = (
            status == ValidationStatus.PUBLISHED and self.instance.status == ValidationStatus.DRAFT
        )
        if publishing and not all_sources_public(self.instance):
            raise serializers.ValidationError(
                {"status": "Make every dataset or the prediction public before publishing."}
            )
        return attrs


class AnswerSerializer(serializers.Serializer):
    tile_id = serializers.IntegerField(min_value=0, max_value=MAX_TILE_ID)
    valid = serializers.BooleanField()


class AnswerBatchSerializer(serializers.Serializer):
    guest_id = serializers.UUIDField(required=False)
    answers = serializers.ListField(
        child=AnswerSerializer(), allow_empty=False, max_length=ANSWERS_PER_REQUEST
    )
