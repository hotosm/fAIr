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
    models_count = serializers.SerializerMethodField()
    datasets_count = serializers.SerializerMethodField()
    feedbacks_count = serializers.SerializerMethodField()
    approved_predictions_count = serializers.SerializerMethodField()
    profile_completion_percentage = serializers.SerializerMethodField()
    unread_notifications_count = serializers.SerializerMethodField()

    class Meta:
        model = OsmUser
        fields = [
            "osm_id",
            "username",
            "img_url",
            "email",
            "date_joined",
            "last_login",
            "email_verified",
            "account_deletion_requested",
            "newsletter_subscription",
            "notifications_delivery_methods",
            "models_count",
            "datasets_count",
            "feedbacks_count",
            "approved_predictions_count",
            "profile_completion_percentage",
            "unread_notifications_count",
        ]
        read_only_fields = [
            "osm_id",
            "username",
            "img_url",
            "date_joined",
            "email_verified",
            "last_login",
            "models_count",
            "datasets_count",
            "feedbacks_count",
            "approved_predictions_count",
            "profile_completion_percentage",
            "unread_notifications_count",
        ]

    def get_models_count(self, obj: OsmUser) -> int:
        from modelregistry.models import LocalModel

        return LocalModel.objects.filter(user=obj).count()

    def get_datasets_count(self, obj: OsmUser) -> int:
        from datasets.models import Dataset

        return Dataset.objects.filter(user=obj).count()

    def get_feedbacks_count(self, obj: OsmUser) -> int:
        from feedback.models import Feedback
        from shared.enums import FeedbackAction

        return Feedback.objects.filter(user=obj, action=FeedbackAction.REJECT).count()

    def get_approved_predictions_count(self, obj: OsmUser) -> int:
        from feedback.models import Feedback
        from shared.enums import FeedbackAction

        return Feedback.objects.filter(user=obj, action=FeedbackAction.ACCEPT).count()

    def get_profile_completion_percentage(self, obj: OsmUser) -> int:
        percentage = 25
        if obj.img_url:
            percentage += 25
        if obj.email:
            percentage += 25
        if obj.email_verified:
            percentage += 25
        return percentage

    def get_unread_notifications_count(self, obj: OsmUser) -> int:
        return UserNotification.objects.filter(user=obj, is_read=False).count()


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
