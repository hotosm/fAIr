from django.contrib.gis.db import models as geomodels
from django.db import models
from login.models import OsmUser

# Create your models here.


class Dataset(models.Model):
    class DatasetStatus(models.IntegerChoices):
        ARCHIVED = 1
        ACTIVE = 0

    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    last_modified = models.DateTimeField(auto_now=True)
    created_date = models.DateTimeField(auto_now_add=True)
    source_imagery = models.URLField(blank=True, null=True)
    status = models.IntegerField(
        default=0, choices=DatasetStatus.choices
    )  # 0 for active , 1 for archieved


class AOI(models.Model):
    class DownloadStatus(models.IntegerChoices):
        DOWNLOADED = 1
        NOT_DOWNLOADED = -1
        RUNNING = 0

    dataset = models.ForeignKey(Dataset, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.PolygonField(srid=4326)
    download_status = models.IntegerField(default=-1, choices=DownloadStatus.choices)
    imagery_status = models.IntegerField(default=-1, choices=DownloadStatus.choices)
    last_fetched_date = models.DateTimeField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)


class Label(models.Model):
    aoi = models.ForeignKey(AOI, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.GeometryField(srid=4326)
    osm_id = models.BigIntegerField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)


class Model(models.Model):
    class ModelStatus(models.IntegerChoices):
        ARCHIVED = 1
        PUBLISHED = 0

    dataset = models.ForeignKey(Dataset, to_field="id", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    status = models.IntegerField(default=0, choices=ModelStatus.choices)  #


class Training(models.Model):
    STATUS_CHOICES = (
        ("SUBMITTED", "SUBMITTED"),
        ("RUNNING", "RUNNING"),
        ("FINISHED", "FINISHED"),
        ("FAILED", "FAILED"),
    )
    model = models.ForeignKey(Model, to_field="id", on_delete=models.CASCADE)
    description = models.TextField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        choices=STATUS_CHOICES, default="SUBMITTED", max_length=10
    )
    created_by = models.ForeignKey(OsmUser, to_field="osm_id", on_delete=models.CASCADE)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True)
