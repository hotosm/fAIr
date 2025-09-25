import re

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db import models as geomodels
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from login.models import OsmUser
from .validators import validate_geometry, validate_geojson
from .exceptions import ValidationException, handle_validation_error


class Dataset(models.Model):
    class DatasetStatus(models.IntegerChoices):
        ARCHIVED = 1
        ACTIVE = 0
        DRAFT = -1

    name = models.CharField(max_length=50)
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    last_modified = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    source_imagery = models.URLField(blank=True, null=True)
    status = models.IntegerField(
        default=-1, choices=DatasetStatus.choices
    )

    offset = ArrayField(
        base_field=models.FloatField(),
        size=2,
        default=[0.0, 0.0],
        verbose_name="Imagery Offset [x, y]",
    )

    def clean(self):
        if self.offset and len(self.offset) != 2:
            raise handle_validation_error("offset", "Offset must be a list of exactly two numbers", self.offset)


class AOI(models.Model):
    class DownloadStatus(models.IntegerChoices):
        DOWNLOADED = 1
        NOT_DOWNLOADED = -1
        RUNNING = 0

    dataset = models.ForeignKey(Dataset, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.PolygonField(srid=4326)
    label_status = models.IntegerField(default=-1, choices=DownloadStatus.choices)
    label_fetched = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)

    class Meta:
        indexes = [
            models.Index(fields=['dataset']),
            models.Index(fields=['geom'], name='aoi_geom_gist_idx', opclasses=['gist']),
        ]

    @transaction.atomic
    def clean(self):
        if self.geom:
            self.geom = validate_geometry(self.geom)


class Label(models.Model):
    aoi = models.ForeignKey(AOI, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.GeometryField(srid=4326)
    osm_id = models.BigIntegerField(null=True, blank=True)
    tags = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['aoi']),
            models.Index(fields=['osm_id']),
            models.Index(fields=['geom'], name='label_geom_gist_idx', opclasses=['gist']),
        ]

    @transaction.atomic
    def clean(self):
        if self.geom:
            self.geom = validate_geometry(self.geom)


class Model(models.Model):
    BASE_MODEL_CHOICES = (
        ("RAMP", "RAMP"),
        ("YOLO_V8_V1", "YOLO_V8_V1"),
        ("YOLO_V8_V2", "YOLO_V8_V2"),
    )

    class ModelStatus(models.IntegerChoices):
        ARCHIVED = 1
        PUBLISHED = 0
        DRAFT = -1

    dataset = models.ForeignKey(Dataset, to_field="id", on_delete=models.PROTECT)
    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    description = models.TextField(max_length=4000, null=True, blank=True)
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    published_training = models.PositiveIntegerField(null=True, blank=True)
    status = models.IntegerField(default=-1, choices=ModelStatus.choices)
    base_model = models.CharField(
        choices=BASE_MODEL_CHOICES, default="RAMP", max_length=50
    )

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_modified']),
            models.Index(fields=['user']),
            models.Index(fields=['dataset']),
        ]


class Training(models.Model):
    STATUS_CHOICES = (
        ("SUBMITTED", "SUBMITTED"),
        ("RUNNING", "RUNNING"),
        ("FINISHED", "FINISHED"),
        ("FAILED", "FAILED"),
    )
    model = models.ForeignKey(Model, to_field="id", on_delete=models.CASCADE)
    source_imagery = models.URLField(blank=True, null=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        choices=STATUS_CHOICES, default="SUBMITTED", max_length=10
    )
    task_id = models.CharField(null=True, blank=True, max_length=100)
    zoom_level = ArrayField(
        models.PositiveIntegerField(),
        size=4,
    )
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True)
    epochs = models.PositiveIntegerField()
    chips_length = models.PositiveIntegerField(default=0)
    batch_size = models.PositiveIntegerField()
    freeze_layers = models.BooleanField(default=False)
    centroid = geomodels.PointField(srid=4326, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['model']),
            models.Index(fields=['status']),
            models.Index(fields=['user']),
        ]

    def get_source_imagery_type(self):
        if not self.source_imagery:
            return "UNKNOWN"
        xyz_pattern = re.compile(
            r"^https?:\/\/[^\/]+(?:\/[^\/]+)*\/\{z\}\/\{x\}\/\{y\}(?:@[0-9a-z]+)?(?:\.(jpg|png|jpeg|webp))?(?:\?.*)?$",
            re.IGNORECASE,
        )
        tms_pattern = re.compile(
            r"^https?:\/\/[^\/]+(?:\/[^\/]+)*\/\{z\}\/\{x\}\/\{-y\}(?:@[0-9a-z]+)?(?:\.(jpg|png|jpeg|webp))?(?:\?.*)?$",
            re.IGNORECASE,
        )
        tilejson_pattern = re.compile(
            r"^https?:\/\/[^\/]+(?:\/[^\/?#]+)*\/[^\/?#]+\.json(?:\?.*)?$",
            re.IGNORECASE,
        )

        url = self.source_imagery
        if tilejson_pattern.match(url):
            return "TILEJSON"
        elif xyz_pattern.match(url):
            return "XYZ"
        elif tms_pattern.match(url):
            return "TMS"
        else:
            return "UNKNOWN"


class Banner(models.Model):
    message = models.TextField(max_length=500)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    def is_displayable(self):
        now = timezone.now()
        return (self.start_date <= now) and (
            self.end_date is None or self.end_date >= now
        )

    def __str__(self):
        return self.message


class UserNotification(models.Model):
    user = models.ForeignKey(
        OsmUser,
        to_field="osm_id",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    message = models.TextField(max_length=500)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.DO_NOTHING, null=True
    )
    object_id = models.PositiveIntegerField(null=True)
    related_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        indexes = [
            models.Index(fields=['is_read']),
            models.Index(fields=['user']),

        ]

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}..."


class Feedback(models.Model):
    ACTION_CHOICES = (
        ("ACCEPT", "ACCEPT"),
        ("REJECT", "REJECT"),
    )
    geom = geomodels.GeometryField(srid=4326)
    training = models.ForeignKey(
        Training, to_field="id", on_delete=models.CASCADE, blank=True, null=True
    )
    action = models.CharField(choices=ACTION_CHOICES, default="ACCEPT", max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    config = models.JSONField(null=True, blank=True)
    comments = models.TextField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)

    class Meta:
        indexes = [
            models.Index(fields=['training']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['geom'], name='feedback_geom_gist_idx', opclasses=['gist']),
        ]

    def clean(self):
        if self.geom:
            self.geom = validate_geometry(self.geom)


class Prediction(models.Model):
    STATUS_CHOICES = (
        ("SUBMITTED", "SUBMITTED"),
        ("RUNNING", "RUNNING"),
        ("FINISHED", "FINISHED"),
        ("FAILED", "FAILED"),
    )
    description = models.TextField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        choices=STATUS_CHOICES, default="SUBMITTED", max_length=10
    )
    result_count = models.PositiveIntegerField(default=0)
    task_id = models.CharField(null=True, blank=True, max_length=100)
    mapswipe_id = models.CharField(null=True, blank=True, max_length=100)
    config = models.JSONField(null=True, blank=True)
    geom = geomodels.PolygonField(srid=4326)
    user = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)

    @transaction.atomic
    def clean(self):
        if self.geom:
            self.geom = validate_geometry(self.geom)
        if self.config:
            required_fields = ["checkpoint", "zoom_level", "source"]
            missing_fields = [
                field for field in required_fields if field not in self.config
            ]
            if missing_fields:
                raise handle_validation_error("config", f"Missing required fields: {', '.join(missing_fields)}", self.config)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]
