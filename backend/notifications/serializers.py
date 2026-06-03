from rest_framework import serializers

from accounts.models import OsmUser

from .models import Banner, UserNotification


class UserSerializer(serializers.ModelSerializer):
    """Compact public user view used as a nested field across the API."""

    class Meta:
        model = OsmUser
        fields = ["osm_id", "username"]
        read_only_fields = ["osm_id", "username"]


class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsmUser
        fields = [
            "osm_id",
            "username",
            "img_url",
            "email",
            "email_verified",
            "account_deletion_requested",
            "newsletter_subscription",
            "notifications_delivery_methods",
            "last_login",
        ]
        read_only_fields = [
            "osm_id",
            "username",
            "img_url",
            "email_verified",
            "last_login",
        ]


class BannerSerializer(serializers.ModelSerializer):
    is_displayable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Banner
        fields = ["id", "message", "start_date", "end_date", "is_displayable"]


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = ["id", "message", "is_read", "created_at", "read_at"]
        read_only_fields = ["id", "created_at", "read_at"]
