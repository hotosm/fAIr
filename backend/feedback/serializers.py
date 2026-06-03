from rest_framework_gis.serializers import GeoFeatureModelSerializer

from notifications.serializers import UserSerializer

from .models import Feedback


class FeedbackSerializer(GeoFeatureModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Feedback
        geo_field = "geom"
        id_field = False
        auto_bbox = False
        fields = [
            "id",
            "stac_id",
            "geom",
            "action",
            "comments",
            "config",
            "user",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
