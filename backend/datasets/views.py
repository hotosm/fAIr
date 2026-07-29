import secrets

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from gpxpy.gpx import GPX, GPXTrack, GPXTrackPoint, GPXTrackSegment
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter

from accounts.authentication import OsmAuthentication
from accounts.permissions import (
    IsAdmin,
    IsOwnerOrAdmin,
    IsOwnerOrAdminOrReadOnly,
    PublishedReadOrAuthenticatedWrite,
    _is_admin,
)
from shared.enums import Visibility
from shared.integrations.stac import (
    DATASETS_COLLECTION,
    FAIR_PINNED_PROPERTY,
    bulk_get_cached_items,
    get_cached_item,
    set_item_property,
)

from .models import AOI, Dataset
from .serializers import AOISerializer, DatasetCreateSerializer, DatasetSerializer
from .tasks import build_dataset


def _wants_expand_stac(request) -> bool:
    return request.query_params.get("expand") == "stac"


@extend_schema_view(
    list=extend_schema(
        description=(
            "List datasets the caller can read. Default response is DB-only. "
            "Pass `?expand=stac` to inline catalog metadata from STAC per row."
        ),
    ),
    create=extend_schema(description="Create a Dataset record without launching a build."),
    retrieve=extend_schema(
        description=(
            "Retrieve one dataset by id. Pass `?expand=stac` to inline catalog metadata from STAC."
        ),
    ),
    update=extend_schema(description="Replace a dataset (owner/admin only)."),
    partial_update=extend_schema(description="Patch a dataset (owner/admin only)."),
    destroy=extend_schema(description="Delete a dataset (owner/admin only)."),
    pin=extend_schema(
        description=(
            "Toggle the `fair:pinned` STAC property on the dataset (admin only). "
            "Writes via read-modify-publish;"
        ),
    ),
    build=extend_schema(description="Submit a dataset build job for the given AOIs."),
)
class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [PublishedReadOrAuthenticatedWrite, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "visibility", "user"]
    search_fields = ["title", "stac_id"]
    ordering_fields = ["created_at", "last_modified"]

    def get_queryset(self):
        from shared.stars import annotate_stars

        qs = Dataset.objects.all()
        user = self.request.user
        if not user.is_authenticated:
            qs = qs.filter(visibility=Visibility.PUBLIC)
        elif not _is_admin(user):
            qs = qs.filter(Q(user=user) | Q(visibility=Visibility.PUBLIC))
        return annotate_stars(qs, self.request)

    def get_permissions(self):
        if self.action == "pin":
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"publish", "unpublish", "build"}:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["stac_items_by_id"] = self._stac_items_for_request()
        return context

    def _stac_items_for_request(self) -> dict:
        if not _wants_expand_stac(self.request):
            return {}
        if self.action == "retrieve":
            obj = self.get_object()
            payload = get_cached_item(DATASETS_COLLECTION, obj.stac_id)
            return {(DATASETS_COLLECTION, obj.stac_id): payload}
        if self.action == "list":
            page = self.paginate_queryset(self.filter_queryset(self.get_queryset()))
            if page is None:
                page = list(self.filter_queryset(self.get_queryset()))
            self._cached_page = page
            pairs = [(DATASETS_COLLECTION, d.stac_id) for d in page]
            return bulk_get_cached_items(pairs)
        return {}

    def list(self, request, *args, **kwargs):
        if _wants_expand_stac(request):
            self.get_serializer_context()
            page = getattr(self, "_cached_page", None)
            if page is not None and self.paginator is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
        return super().list(request, *args, **kwargs)

    @extend_schema(request=None, responses={200: DatasetSerializer})
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk: int | None = None) -> Response:
        dataset = self.get_object()
        dataset.visibility = Visibility.PUBLIC
        dataset.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(dataset).data, status=status.HTTP_200_OK)

    @extend_schema(request=None, responses={200: DatasetSerializer})
    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk: int | None = None) -> Response:
        dataset = self.get_object()
        dataset.visibility = Visibility.PRIVATE
        dataset.save(update_fields=["visibility", "last_modified"])
        return Response(self.get_serializer(dataset).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="pin")
    def pin(self, request, pk: int | None = None) -> Response:
        dataset = self.get_object()
        desired = bool(request.data.get("is_pinned", True))
        stac_item = set_item_property(
            DATASETS_COLLECTION, dataset.stac_id, FAIR_PINNED_PROPERTY, desired
        )
        serializer = self.get_serializer(
            dataset,
            context={
                **self.get_serializer_context(),
                "stac_items_by_id": {(DATASETS_COLLECTION, dataset.stac_id): stac_item},
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=DatasetCreateSerializer,
        responses={202: DatasetSerializer},
        examples=[
            OpenApiExample(
                "Buildings dataset",
                value={
                    "title": "banepa-buildings",
                    "description": "Buildings training dataset",
                    "source_imagery": (
                        "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/"
                        "62d85d11d8499800053796c2/{z}/{x}/{y}"
                    ),
                    "category": "buildings",
                    "zoom": 19,
                    "aoi_ids": [1],
                    "label_tasks": ["semantic-segmentation"],
                    "label_classes": [{"name": "building", "classes": ["*"]}],
                    "keywords": ["building", "polygon"],
                    "label_type": "vector",
                    "geometry_type": "polygon",
                },
                request_only=True,
            )
        ],
    )
    @action(detail=False, methods=["post"], url_path="build")
    def build(self, request) -> Response:
        serializer = DatasetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        aoi_qs = AOI.objects.filter(id__in=payload["aoi_ids"], user=request.user)
        if aoi_qs.count() != len(payload["aoi_ids"]):
            return Response(
                {"detail": "One or more aoi_ids not found or not owned by user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        dataset = Dataset.objects.create(
            stac_id=_slugify(payload["title"]),
            title=payload["title"],
            source_imagery=payload["source_imagery"],
            category=payload["category"],
            status=Dataset.Status.BUILDING,
            user=request.user,
        )
        aoi_qs.update(dataset=dataset)

        build_dataset.enqueue(
            dataset_id=dataset.id,
            description=payload["description"],
            label_tasks=payload["label_tasks"],
            label_classes=payload["label_classes"],
            keywords=payload["keywords"],
            label_type=payload["label_type"],
            zoom=payload["zoom"],
            geometry_type=payload["geometry_type"],
        )
        return Response(DatasetSerializer(dataset).data, status=status.HTTP_202_ACCEPTED)


@extend_schema_view(
    list=extend_schema(description="List AOIs visible to the caller, optionally filtered by bbox."),
    create=extend_schema(
        description="Create an AOI polygon owned by the caller.",
        examples=[
            OpenApiExample(
                "Banepa AOI",
                value={
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [85.51678, 27.63133],
                                [85.52323, 27.63133],
                                [85.52323, 27.63743],
                                [85.51678, 27.63743],
                                [85.51678, 27.63133],
                            ]
                        ],
                    },
                    "properties": {"dataset": None},
                },
                request_only=True,
            )
        ],
    ),
    retrieve=extend_schema(description="Retrieve one AOI by id."),
    update=extend_schema(description="Replace an AOI (owner/admin only)."),
    partial_update=extend_schema(description="Patch an AOI (owner/admin only)."),
    destroy=extend_schema(description="Delete an AOI (owner/admin only)."),
)
class AOIViewSet(viewsets.ModelViewSet):
    queryset = AOI.objects.all()
    serializer_class = AOISerializer
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, InBBoxFilter]
    filterset_fields = ["dataset", "user"]
    bbox_filter_field = "geom"
    bbox_filter_include_overlapping = True

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)


@extend_schema(tags=["datasets"])
class GenerateGpxView(APIView):
    authentication_classes = [OsmAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Export the AOI's polygon boundary as a GPX track XML file.",
        responses=OpenApiResponse(
            OpenApiTypes.STR,
            description="GPX track XML for the AOI's polygon boundary.",
        ),
    )
    def get(self, request, aoi_id: int) -> HttpResponse:
        aoi = get_object_or_404(AOI, id=aoi_id)
        gpx = GPX()
        track = GPXTrack(name=f"AOI {aoi.id}")
        gpx.tracks.append(track)
        segment = GPXTrackSegment()
        track.segments.append(segment)
        for x, y in aoi.geom.coords[0]:
            segment.points.append(GPXTrackPoint(latitude=y, longitude=x))
        return HttpResponse(gpx.to_xml(), content_type="application/xml")


def _slugify(value: str) -> str:
    base = slugify(value) or "untitled"
    return f"{base}-{secrets.token_hex(3)}"


__all__ = ["AOIViewSet", "DatasetViewSet", "GenerateGpxView"]
