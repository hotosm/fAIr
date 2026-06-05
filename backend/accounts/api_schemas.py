"""Response shapes for the accounts/auth views.

Plain APIViews don't expose a serializer_class drf-spectacular can introspect,
so each method is annotated with @extend_schema(responses=<one of these>).
"""

from rest_framework import serializers


class MessageResponse(serializers.Serializer):
    message = serializers.CharField()


class ErrorResponse(serializers.Serializer):
    error = serializers.CharField()


class _HankoUserPayload(serializers.Serializer):
    id = serializers.CharField()
    email = serializers.EmailField()


class _OsmUserPayload(serializers.Serializer):
    osm_id = serializers.IntegerField()
    username = serializers.CharField()
    is_real_osm = serializers.BooleanField()


class AuthStatusResponse(serializers.Serializer):
    auth_provider = serializers.ChoiceField(choices=["dev", "hanko"])
    authenticated = serializers.BooleanField()
    needs_onboarding = serializers.BooleanField(required=False)
    hanko_authenticated = serializers.BooleanField(required=False)
    user = _OsmUserPayload(required=False)
    hanko_user = _HankoUserPayload(required=False)


class EmailVerifyQueryResponse(serializers.Serializer):
    """Body of `GET /me/verify-email/?uid=&token=`."""

    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
