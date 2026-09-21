from rest_framework import serializers

# Placeholders a TMS tile URL template must contain
TMS_PLACEHOLDERS = ("{x}", "{y}", "{z}")

# TMS tile zoom bounds accepted for dataset creation and prediction submission
# (not the config-driven PMTiles generation range).
MIN_ZOOM = 14
MAX_ZOOM = 22


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
