from rest_framework import serializers


class WorkspaceListingSerializer(serializers.Serializer):
    folders = serializers.ListField(child=serializers.DictField(child=serializers.CharField()))
    files = serializers.ListField(child=serializers.DictField())


class WorkspacePresignedSerializer(serializers.Serializer):
    url = serializers.URLField()
    expires_in = serializers.IntegerField()
