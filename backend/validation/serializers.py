import re

from rest_framework import serializers

from accounts.permissions import is_admin
from accounts.serializers import UserSerializer
from datasets.models import Dataset
from predictions.models import Prediction
from shared.enums import DatasetStatus, ValidationStatus, ValidationType, Visibility

from .models import ValidationProject

ANSWERS_PER_REQUEST = 50
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


class ValidationProjectSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ValidationProject
        fields = [
            "id",
            "source_id",
            "type",
            "title",
            "description",
            "answers_needed",
            "status",
            "build_status",
            "build_error",
            "build_requested_at",
            "user",
            "created_at",
        ]
        read_only_fields = [
            "id",
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

    def validate(self, attrs: dict) -> dict:
        if self.instance is None:
            if attrs.get("status", ValidationStatus.DRAFT) != ValidationStatus.DRAFT:
                raise serializers.ValidationError({"status": "A new project starts as a draft."})
            source = project_source(attrs["type"], attrs["source_id"])
            if source is None:
                raise serializers.ValidationError(
                    {"source_id": "No built dataset or finished prediction with this id."}
                )
            user = self.context["request"].user
            if source.user != user and not is_admin(user):
                raise serializers.ValidationError(
                    {"source_id": "Only its owner or an admin can validate it."}
                )
            imagery: dict[str, str] = source.imagery  # type: ignore[assignment]
            if len(imagery) != 1:
                raise serializers.ValidationError(
                    {"source_id": "Only sources with one imagery input can be validated."}
                )
            if isinstance(source, Prediction) and not source.feature_count:
                raise serializers.ValidationError({"source_id": "This prediction found nothing."})
            return attrs
        if self.instance.status == ValidationStatus.FINISHED:
            raise serializers.ValidationError({"status": "A finished project cannot change."})
        for field in ("source_id", "type"):
            if field in attrs and attrs[field] != getattr(self.instance, field):
                raise serializers.ValidationError({field: "Cannot change after creation."})
        status = attrs.get("status", self.instance.status)
        if status != self.instance.status and _NEXT_STATUS.get(self.instance.status) != status:
            raise serializers.ValidationError(
                {"status": f"Cannot move from {self.instance.status} to {status}."}
            )
        if status == ValidationStatus.PUBLISHED and self.instance.status == ValidationStatus.DRAFT:
            source = project_source(self.instance.type, self.instance.source_id)
            if source is None or source.visibility != Visibility.PUBLIC:
                raise serializers.ValidationError(
                    {"status": "Make the dataset or prediction public before publishing."}
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
