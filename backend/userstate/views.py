from django.conf import settings
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from accounts.authentication import OsmAuthentication
from accounts.permissions import IsOwnerOrAdmin, _is_admin

from .models import UserState
from .serializers import UserStateSerializer

# Room for the request envelope around `state`.
BODY_OVERHEAD_BYTES = 1024

_STATE_EXAMPLE = OpenApiExample(
    "Save a past prediction for the profile",
    value={
        "state": {
            "type": "prediction",
            "prediction_id": 58,
            "name": "Banepa buildings",
            "model": {"id": "dinov3s-buildings", "title": "DINO Buildings"},
            "imagery": {
                "name": "Banepa drone survey",
                "url": "https://api.imagery.hotosm.org/raster/collections/openaerialmap/items/44e68faf-21f9-4bba-8d5d-8c75dfdcf524/WebMercatorQuad/tilejson.json?assets=visual",
            },
            "zoom": 19,
            "bbox": [85.5, 27.6, 85.52, 27.63],
        }
    },
    request_only=True,
)


@extend_schema_view(
    list=extend_schema(
        description="List the caller's saved states, newest first; admins see every user's."
    ),
    create=extend_schema(
        description=(
            "Save a new state for the caller. `state` is any JSON value except null, "
            f"up to {settings.USER_STATE_MAX_BYTES} bytes."
        ),
        examples=[_STATE_EXAMPLE],
    ),
    retrieve=extend_schema(description="Retrieve one of the caller's states."),
    update=extend_schema(
        description="Replace one of the caller's states.", examples=[_STATE_EXAMPLE]
    ),
    partial_update=extend_schema(
        description="Update one of the caller's states.", examples=[_STATE_EXAMPLE]
    ),
    destroy=extend_schema(description="Delete one of the caller's states."),
)
@extend_schema(tags=["user-state"])
class UserStateViewSet(viewsets.ModelViewSet):
    """Users reach only their own rows (another user's pid is 404); admins reach every row."""

    serializer_class = UserStateSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = "pid"
    queryset = UserState.objects.none()

    def initial(self, request, *args, **kwargs) -> None:
        super().initial(request, *args, **kwargs)
        max_body_bytes = settings.USER_STATE_MAX_BYTES + BODY_OVERHEAD_BYTES
        if int(request.META.get("CONTENT_LENGTH") or 0) > max_body_bytes:
            raise ValidationError(f"Request body must be at most {max_body_bytes} bytes.")

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return UserState.objects.none()
        if _is_admin(self.request.user):
            return UserState.objects.all()
        return UserState.objects.filter(user=self.request.user)

    def perform_create(self, serializer: UserStateSerializer) -> None:
        serializer.save(user=self.request.user)
