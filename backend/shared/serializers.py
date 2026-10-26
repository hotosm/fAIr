from collections.abc import Callable
from typing import Any

from fair.stac.inputs import IMAGE_INPUT, INPUT_NAME_PATTERN
from rest_framework import serializers

from shared.imagery import INPUT_NAME_MAX_LENGTH
from shared.public_urls import NonPublicURLError, require_public_url

# Placeholders a TMS tile URL template must contain
TMS_PLACEHOLDERS = ("{x}", "{y}", "{z}")

# TMS tile zoom bounds accepted for dataset creation and prediction submission
# (not the config-driven PMTiles generation range).
MIN_ZOOM = 14
MAX_ZOOM = 22


def validate_public_url(value: str, schemes: tuple[str, ...]) -> str:
    try:
        require_public_url(value, schemes)
    except NonPublicURLError as exc:
        raise serializers.ValidationError(str(exc)) from exc
    return value


def validate_input_imagery(
    imagery: dict[str, str], validate_url: Callable[[str], str]
) -> dict[str, str]:
    """Imagery keyed by model input name; names become storage paths, so they are slugs."""
    for input_name, url in imagery.items():
        if len(input_name) > INPUT_NAME_MAX_LENGTH:
            raise serializers.ValidationError(
                f"input name {input_name!r} is longer than {INPUT_NAME_MAX_LENGTH} characters"
            )
        if not INPUT_NAME_PATTERN.fullmatch(input_name):
            raise serializers.ValidationError(
                f"input name {input_name!r} must start with a lowercase letter or digit and "
                "contain only lowercase letters, digits, '_' or '-'"
            )
        validate_url(url)
    return imagery


def imagery_from_shorthand(attrs: dict[str, Any], shorthand: str) -> dict[str, Any]:
    """Requires exactly one of `imagery` and the single-image `shorthand` field, read as `image`."""
    url = attrs.pop(shorthand, None)
    if (url is None) == ("imagery" not in attrs):
        raise serializers.ValidationError({"imagery": f"Give either imagery or {shorthand}."})
    if url is not None:
        attrs["imagery"] = {IMAGE_INPUT: url}
    return attrs


class StacAssetSerializer(serializers.Serializer):
    href = serializers.CharField()
    type = serializers.CharField(required=False)
    title = serializers.CharField(required=False)
    roles = serializers.ListField(child=serializers.CharField(), required=False)


class StacFacetSerializer(serializers.Serializer):
    """The slice of a STAC item the API merges into list/detail responses.

    `properties` is a free dict so consumers can read fAIr extensions
    (`fair:pinned`, `fair:metrics_spec`, etc.) without redeclaring them.
    """

    description = serializers.CharField(allow_null=True, required=False)
    datetime = serializers.CharField(allow_null=True, required=False)
    geometry = serializers.JSONField(allow_null=True, required=False)
    assets = serializers.DictField(child=StacAssetSerializer(), required=False)
    properties = serializers.DictField(required=False)
    links = serializers.ListField(child=serializers.DictField(), required=False)


class RunStatusSerializer(serializers.Serializer):
    run_id = serializers.CharField()
    status = serializers.CharField()
    is_terminal = serializers.BooleanField()


class RunLogsQuerySerializer(serializers.Serializer):
    tail = serializers.IntegerField(min_value=1, default=1000)
    step = serializers.CharField(required=False)
    since = serializers.DateTimeField(required=False)


class LogEntrySerializer(serializers.Serializer):
    level = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.CharField(allow_null=True)
