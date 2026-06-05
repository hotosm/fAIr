from django.utils.text import slugify
from rest_framework import serializers

from notifications.serializers import UserSerializer

from .models import TrainingRunRef


class TrainingSubmitSerializer(serializers.Serializer):
    base_model_stac_id = serializers.CharField(max_length=200)
    dataset_stac_id = serializers.CharField(max_length=200)
    model_name = serializers.CharField(max_length=200)
    overrides = serializers.DictField(required=False, default=dict)
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        default="",
        help_text=(
            "Optional readable title carried onto the published STAC "
            'item. Falls back to "{model_name} v{N}" at publish time when '
            "left empty."
        ),
    )
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=80),
        required=False,
        default=list,
        help_text=(
            "Extra keywords carried onto the published STAC item. Merged "
            "additively at publish time with base-model keywords, dataset "
            "keywords, and the dataset's geometry_type."
        ),
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_model_name(self, value: str) -> str:
        # Slugify so the value is safe as a ZenML model_name + STAC mlm:name.
        slug = slugify(value)
        if not slug:
            raise serializers.ValidationError(
                "model_name must contain at least one alphanumeric character."
            )
        return slug

    def validate_keywords(self, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))


class TrainingRunRefSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TrainingRunRef
        fields = [
            "id",
            "zenml_run_id",
            "local_model",
            "base_model_stac_id",
            "dataset",
            "overrides",
            "title",
            "keywords",
            "description",
            "status",
            "user",
            "submitted_at",
            "last_polled_at",
        ]
        read_only_fields = [
            "id",
            "zenml_run_id",
            "status",
            "user",
            "submitted_at",
            "last_polled_at",
        ]


class TrainingPublishSerializer(serializers.Serializer):
    description = serializers.CharField(required=False, allow_blank=True, default="")
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        default="",
        help_text=(
            "Optional Readable title for this version's STAC item. "
            'Falls back to "{model_name} v{N}" when omitted.'
        ),
    )


class RunStatusSerializer(serializers.Serializer):
    run_id = serializers.CharField()
    status = serializers.CharField()
    is_terminal = serializers.BooleanField()


class LogEntrySerializer(serializers.Serializer):
    level = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.CharField(allow_null=True)
