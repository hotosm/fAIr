import httpx
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.authentication import OsmAuthentication
from accounts.permissions import (
    IsAdmin,
    IsOwnerOrAdmin,
    PublishedReadOrAuthenticatedWrite,
    _is_admin,
)
from shared.enums import Visibility
from shared.integrations.stac import (
    FAIR_PINNED_PROPERTY,
    LOCAL_MODELS_COLLECTION,
    get_active_local_model_item,
    set_item_property,
)
from shared.integrations.zenml import list_runs_for_model
from shared.stars import annotate_stars

from .models import BaseModel, Category, LocalModel
from .serializers import (
    BaseModelRegisterSerializer,
    BaseModelSerializer,
    CategorySerializer,
    LocalModelSerializer,
    TrainingRunSummarySerializer,
)
from .tasks import register_base_model

_STAC_FETCH_TIMEOUT_S = 30


def _fetch_stac_item(url: str) -> dict:
    """Fetch and return the STAC item JSON at `url`.

    A URL is a convenience input: the item is fetched once here and stored
    inline, so the link itself is never persisted. A bad URL or a payload
    without ``properties['mlm:name']`` is a caller error surfaced as a 400.
    """
    try:
        response = httpx.get(url, timeout=_STAC_FETCH_TIMEOUT_S, follow_redirects=True)
        response.raise_for_status()
        item = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ValidationError({"stac_item_url": f"could not fetch STAC item: {exc}"}) from exc
    properties = item.get("properties") if isinstance(item, dict) else None
    name = properties.get("mlm:name") if isinstance(properties, dict) else None
    if not name:
        raise ValidationError(
            {"stac_item_url": "fetched STAC item is missing properties['mlm:name']."}
        )
    return item


@extend_schema_view(
    list=extend_schema(description="List local (finetuned) models."),
    retrieve=extend_schema(description="Retrieve one local model by id."),
    pin=extend_schema(
        description=(
            "Toggle the `fair:pinned` STAC property on a model (admin only). "
            "Writes to STAC; the DB row is unchanged."
        ),
    ),
    runs=extend_schema(description="List ZenML pipeline runs that produced this model."),
)
class LocalModelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LocalModel.objects.all()
    serializer_class = LocalModelSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [PublishedReadOrAuthenticatedWrite]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "visibility", "category", "user"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "last_modified"]

    def get_queryset(self):
        qs = LocalModel.objects.all().annotate(run_count=Count("runs"))
        user = self.request.user
        if not (user and user.is_authenticated):
            qs = qs.filter(visibility=Visibility.PUBLIC)
        elif not _is_admin(user):
            qs = qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))
        return annotate_stars(qs, self.request, key_field="name")

    def get_permissions(self):
        if self.action == "pin":
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"publish", "unpublish"}:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()

    @extend_schema(request=None, responses={200: LocalModelSerializer})
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        model.visibility = Visibility.PUBLIC
        model.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @extend_schema(request=None, responses={200: LocalModelSerializer})
    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        model.visibility = Visibility.PRIVATE
        model.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="pin")
    def pin(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        # STAC items are keyed by version UUID; the active version is
        # whichever STAC item has mlm:name == model.name.
        active = get_active_local_model_item(model.name)
        if active is None:
            return Response(
                {
                    "detail": (
                        f"Model '{model.name}' has no active STAC version. "
                        "Promote at least one training run before pinning."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )
        desired = bool(request.data.get("is_pinned", True))
        set_item_property(LOCAL_MODELS_COLLECTION, active.id, FAIR_PINNED_PROPERTY, desired)
        return Response(self.get_serializer(model).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="runs")
    def runs(self, request, pk: int | None = None) -> Response:
        model = self.get_object()
        limit = int(request.query_params.get("limit", 50))
        summaries = list_runs_for_model(model.name, limit=limit)
        data = [
            {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "created_at": s.created_at,
                "pipeline_name": s.pipeline_name,
                "model_name": s.model_name,
                "model_version": s.model_version,
            }
            for s in summaries
        ]
        return Response(TrainingRunSummarySerializer(data, many=True).data)


@extend_schema_view(
    list=extend_schema(description="List registered base models (family records)."),
    retrieve=extend_schema(description="Retrieve one base model by id."),
    create=extend_schema(
        description=(
            "Register a base model from an inline STAC item JSON or a URL to one "
            "(admin only). Supply exactly one of `stac_item` or `stac_item_url`. "
            "Validates and publishes the item to the base-models collection "
            "off-request; poll `status`."
        ),
        request=BaseModelRegisterSerializer,
        responses={202: BaseModelSerializer},
        examples=[
            OpenApiExample(
                "Inline STAC item",
                value={
                    "stac_item": {
                        "type": "Feature",
                        "id": "ramp-buildings",
                        "properties": {"mlm:name": "ramp-buildings"},
                        "assets": {},
                    },
                    "category": "buildings",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Link to a STAC item",
                value={
                    "stac_item_url": "https://example.com/models/ramp-buildings.json",
                    "category": "buildings",
                },
                request_only=True,
            ),
            OpenApiExample(
                "With an inference endpoint",
                value={
                    "stac_item": {
                        "type": "Feature",
                        "id": "ramp-buildings",
                        "properties": {"mlm:name": "ramp-buildings"},
                        "assets": {},
                    },
                    "category": "buildings",
                    "inference_endpoint": "https://predict.example.com/ramp-buildings",
                },
                request_only=True,
            ),
        ],
    ),
)
class BaseModelViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = BaseModel.objects.all()
    serializer_class = BaseModelSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "visibility", "category", "user"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "last_modified"]

    def get_queryset(self):
        qs = BaseModel.objects.all()
        user = self.request.user
        if not (user and user.is_authenticated):
            qs = qs.filter(visibility=Visibility.PUBLIC)
        elif not _is_admin(user):
            qs = qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))
        return annotate_stars(qs, self.request, key_field="name")

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs) -> Response:
        serializer = BaseModelRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = data.get("category") or Category.objects.get(slug="other")
        stac_item = data.get("stac_item") or _fetch_stac_item(data["stac_item_url"])
        if inference_endpoint := data.get("inference_endpoint"):
            stac_item.setdefault("assets", {})["mlm:inference-endpoint"] = {
                "href": inference_endpoint,
                "type": "application/json",
                "roles": ["mlm:inference-endpoint"],
            }
        name = stac_item["properties"]["mlm:name"]

        base_model, created = BaseModel.objects.get_or_create(
            name=name,
            defaults={
                "user": request.user,
                "category": category,
                "stac_item": stac_item,
                "status": BaseModel.Status.REGISTERING,
            },
        )
        if not created:
            base_model.category = category
            base_model.stac_item = stac_item
            base_model.status = BaseModel.Status.REGISTERING
            base_model.error = ""
            base_model.save(
                update_fields=["category", "stac_item", "status", "error", "last_modified"]
            )

        register_base_model.enqueue(base_model_id=base_model.id)
        return Response(BaseModelSerializer(base_model).data, status=status.HTTP_202_ACCEPTED)


@extend_schema_view(
    list=extend_schema(description="List model categories. No authentication required."),
    retrieve=extend_schema(description="Retrieve one category by slug."),
    create=extend_schema(description="Create a category (admin only)."),
    update=extend_schema(description="Update a category (admin only)."),
    partial_update=extend_schema(description="Partially update a category (admin only)."),
    destroy=extend_schema(description="Delete a category (admin); blocked if a model uses it."),
)
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    authentication_classes = [OsmAuthentication]
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Category is in use by one or more models and cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
