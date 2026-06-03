from rest_framework import serializers

from notifications.serializers import UserSerializer

from .models import LocalModel


class LocalModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    star_count = serializers.IntegerField(read_only=True, default=0)
    is_starred = serializers.BooleanField(read_only=True, default=False)
    run_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = LocalModel
        fields = [
            "id",
            "name",
            "status",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "created_at",
            "last_modified",
        ]
        read_only_fields = [
            "id",
            "user",
            "star_count",
            "is_starred",
            "run_count",
            "created_at",
            "last_modified",
        ]


class TrainingRunSummarySerializer(serializers.Serializer):
    """ZenML run summary, populated from fair.zenml.runs.RunSummary."""

    id = serializers.CharField()
    name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    pipeline_name = serializers.CharField()
    model_name = serializers.CharField(allow_null=True)
    model_version = serializers.IntegerField(allow_null=True)
