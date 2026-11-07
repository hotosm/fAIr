import json
from typing import Any

from django.conf import settings
from rest_framework import serializers

from .models import UserState


class UserStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserState
        fields = ["pid", "state", "timestamp"]
        read_only_fields = ["pid", "timestamp"]

    def validate_state(self, value: Any) -> Any:
        max_bytes = settings.USER_STATE_MAX_BYTES
        if len(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode()) > max_bytes:
            raise serializers.ValidationError(f"state must be at most {max_bytes} bytes of JSON.")
        return value
