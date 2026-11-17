from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets

from .models import Banner
from .serializers import BannerSerializer


@extend_schema_view(
    list=extend_schema(description="List currently-displayable banners."),
)
class BannerViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = BannerSerializer

    def get_queryset(self):
        now = timezone.now()
        running = Q(end_date__isnull=True) | Q(end_date__gte=now)
        return Banner.objects.filter(running, start_date__lte=now).order_by("-start_date")
