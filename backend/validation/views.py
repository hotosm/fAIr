from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import CharFilter, FilterSet
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from upath import UPath

from accounts.permissions import (
    IsOwnerOrAdminOrReadOnly,
    PublishedReadOrAuthenticatedWrite,
    is_admin,
)
from shared.enums import ValidationBuildStatus, ValidationStatus
from shared.storage import StoragePaths, presigned_get_url

from .models import ValidationAnswer, ValidationProject
from .serializers import AnswerBatchSerializer, ValidationProjectSerializer, all_sources_public
from .tasks import build_project, refresh_project
from .throttles import (
    AnswerRateThrottle,
    GuestAnswerRateThrottle,
    GuestReadRateThrottle,
    SignedInRateThrottle,
)

_VISIBLE = [ValidationStatus.PUBLISHED, ValidationStatus.FINISHED]


class ValidationProjectFilter(FilterSet):
    source_id = CharFilter(method="filter_source", help_text="Projects using this source.")

    class Meta:
        model = ValidationProject
        fields = ["type", "status"]

    def filter_source(self, queryset, name: str, value: str):
        return queryset.filter(source_ids__contains=[value])


_CREATE_EXAMPLE = OpenApiExample(
    "Validate a built dataset",
    value={
        "source_ids": ["freetown-buildings-vhr"],
        "type": "training",
        "title": "Freetown buildings, VHR",
        "description": "Are the building outlines correct? Yes if every building is outlined.",
        "answers_needed": 1,
    },
    request_only=True,
)
_ANSWERS_EXAMPLE = OpenApiExample(
    "Two answers from a guest",
    value={
        "guest_id": "0f8b6c1e-2d4a-4a7e-9c3b-5f1e2d3c4b5a",
        "answers": [
            {"tile_id": 93488453812, "valid": True},
            {"tile_id": 93488453813, "valid": False},
        ],
    },
    request_only=True,
)


def _build_is_stale(project: ValidationProject) -> bool:
    started = project.build_requested_at
    timeout = timedelta(seconds=settings.VALIDATION_BUILD_TIMEOUT)
    return started is None or timezone.now() - started > timeout


def _queue_build(project: ValidationProject, only_if_requested_at: datetime | None = None) -> bool:
    rows = ValidationProject.objects.filter(id=project.id)
    if only_if_requested_at is not None:
        rows = rows.filter(build_requested_at=only_if_requested_at)
    requested_at = timezone.now()
    claimed = rows.update(
        build_status=ValidationBuildStatus.BUILDING, build_error="", build_requested_at=requested_at
    )
    if not claimed:
        return False
    project.refresh_from_db()
    transaction.on_commit(
        lambda: build_project.enqueue(project_id=project.id, requested_at=requested_at.isoformat())
    )
    return True


@extend_schema_view(
    list=extend_schema(description="Published and finished projects, plus your drafts."),
    retrieve=extend_schema(description="One validation project."),
    create=extend_schema(
        description="Create a draft from a built dataset or finished prediction.",
        examples=[_CREATE_EXAMPLE],
        responses={202: ValidationProjectSerializer},
    ),
    partial_update=extend_schema(
        description="Edit the text, publish once the files are built, or finish (owner or admin)."
    ),
)
class ValidationProjectViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ValidationProject.objects.all()
    serializer_class = ValidationProjectSerializer
    permission_classes = [PublishedReadOrAuthenticatedWrite, IsOwnerOrAdminOrReadOnly]
    filterset_class = ValidationProjectFilter
    http_method_names = ["get", "post", "patch", "head", "options"]
    throttle_classes = [SignedInRateThrottle, GuestReadRateThrottle]

    def get_queryset(self):
        queryset = ValidationProject.objects.select_related("user")
        user = self.request.user
        if is_admin(user):
            return queryset
        visible = Q(status__in=_VISIBLE)
        if user.is_authenticated:
            visible |= Q(user=user)
        return queryset.filter(visible)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(user=request.user)
        _queue_build(project)
        return Response(self.get_serializer(project).data, status=status.HTTP_202_ACCEPTED)

    def retrieve(self, request, *args, **kwargs):
        project = self.get_object()
        if (
            project.status == ValidationStatus.DRAFT
            and project.build_status == ValidationBuildStatus.BUILDING
            and _build_is_stale(project)
        ):
            # Only one of several requests that see the same stale build queues it again.
            _queue_build(project, only_if_requested_at=project.build_requested_at)
        return Response(self.get_serializer(project).data)

    @extend_schema(
        request=None,
        responses={202: ValidationProjectSerializer},
        description="Build a draft's files again (owner or admin).",
    )
    @action(detail=True, methods=["post"])
    def build(self, request, pk=None) -> Response:
        project = self.get_object()
        if project.status != ValidationStatus.DRAFT:
            raise serializers.ValidationError(
                {"status": "Only a draft can be built again; its files are in use."}
            )
        _queue_build(project)
        return Response(self.get_serializer(project).data, status=status.HTTP_202_ACCEPTED)

    def perform_update(self, serializer) -> None:
        project = serializer.instance
        old_status = project.status
        new_status = serializer.validated_data.get("status", old_status)
        publishing = (
            old_status == ValidationStatus.DRAFT and new_status == ValidationStatus.PUBLISHED
        )
        if publishing and project.build_status != ValidationBuildStatus.BUILT:
            raise serializers.ValidationError(
                {
                    "status": f"Its build failed: {project.build_error}"
                    if project.build_status == ValidationBuildStatus.FAILED
                    else "Its files are still being built."
                }
            )
        serializer.save()
        if new_status != old_status:
            transaction.on_commit(lambda: refresh_project.enqueue(project_id=project.id))

    @extend_schema(
        request=AnswerBatchSerializer,
        examples=[_ANSWERS_EXAMPLE],
        responses={204: None, 410: None},
        description="Save up to 50 answers; resending is harmless, a new answer replaces the old.",
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[AllowAny],
        throttle_classes=[AnswerRateThrottle, GuestAnswerRateThrottle],
    )
    def answers(self, request, pk=None) -> Response:
        project = get_object_or_404(ValidationProject, pk=pk, status__in=_VISIBLE)
        if project.status == ValidationStatus.FINISHED:
            return Response({"detail": "This project is finished."}, status=status.HTTP_410_GONE)
        batch = AnswerBatchSerializer(data=request.data)
        batch.is_valid(raise_exception=True)
        if request.user.is_authenticated:
            respondent = f"u:{request.user.osm_id}"
        elif "guest_id" in batch.validated_data:
            respondent = f"g:{batch.validated_data['guest_id']}"
        else:
            raise serializers.ValidationError({"guest_id": "Required when not signed in."})
        # One upsert cannot touch a row twice, so the last answer per tile wins.
        latest = {answer["tile_id"]: answer["valid"] for answer in batch.validated_data["answers"]}
        ValidationAnswer.objects.bulk_create(
            [
                ValidationAnswer(
                    project=project, tile_id=tile_id, respondent=respondent, valid=valid
                )
                for tile_id, valid in latest.items()
            ],
            update_conflicts=True,
            unique_fields=["project", "tile_id", "respondent"],
            update_fields=["valid", "updated_at"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        responses={302: None, 404: None},
        description="Redirect to a presigned download of one project file.",
    )
    @action(detail=True, methods=["get"], url_path=r"files/(?P<name>[\w.]+)")
    def files(self, request, pk=None, name: str = "") -> HttpResponseRedirect:
        project = self.get_object()
        if name not in StoragePaths.VALIDATION_FILES:
            raise NotFound("Unknown project file.")
        owner = project.user == request.user or is_admin(request.user)
        if not owner and not all_sources_public(project):
            raise NotFound("This project's source is private.")
        # S3 answers 403 for a missing key without s3:ListBucket (S3 GetObject API reference).
        refreshed = name in ("done.bin", "results.parquet")
        if refreshed and not UPath(StoragePaths.validation_file_uri(project.id, name)).exists():
            raise NotFound("This file is written at the first refresh after publishing.")
        return HttpResponseRedirect(
            presigned_get_url(StoragePaths.validation_file_key(project.id, name))
        )
