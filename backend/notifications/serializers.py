from rest_framework import serializers

from .models import Banner


class BannerSerializer(serializers.ModelSerializer):
    is_displayable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Banner
        fields = ["id", "message", "start_date", "end_date", "is_displayable"]
