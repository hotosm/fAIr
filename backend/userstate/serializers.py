import json
from typing import Any

from rest_framework import serializers

from .models import UserState

MAX_STATE_BYTES = 100 * 1024


class UserStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserState
        fields = ["pid", "state", "timestamp"]
        read_only_fields = ["pid", "timestamp"]

    def validate_state(self, value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise serializers.ValidationError("state must be a JSON object.")
        if (
            len(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode())
            > MAX_STATE_BYTES
        ):
            raise serializers.ValidationError(
                f"state must be at most {MAX_STATE_BYTES // 1024} KB of JSON."
            )
        return value
