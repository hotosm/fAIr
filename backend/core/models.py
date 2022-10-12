from django.contrib.gis.db import models as geomodels
from django.db import models
# Create your models here.


class Dataset(models.Model):
    class DatasetStatus(models.IntegerChoices):
        ARCHIVED = 1
        ACTIVE = 0

    name = models.CharField(max_length=255)
    created_by = models.IntegerField()
    last_modified = models.DateTimeField(auto_now=True)
    created_date = models.DateTimeField(auto_now_add=True)
    source_imagery = models.URLField(blank=True, null=True)
    status = models.IntegerField(default=0, choices=DatasetStatus.choices)  # 0 for active , 1 for archieved


class AOI(models.Model):
    class DownloadStatus(models.IntegerChoices):
        DOWNLOADED = 1
        NOT_DOWNLOADED = -1
        RUNNING = 0

    dataset = models.ForeignKey(Dataset, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.PolygonField(srid=4326)
    download_status = models.IntegerField(
        default=-1, choices=DownloadStatus.choices
    )
    imagery_status = models.IntegerField(
        default=-1, choices=DownloadStatus.choices
    )
    last_fetched_date = models.DateTimeField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)


class Label(models.Model):
    aoi = models.ForeignKey(AOI, to_field="id", on_delete=models.CASCADE)
    geom = geomodels.GeometryField(srid=4326)
    osm_id = models.BigIntegerField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)


def element_directory_path(instance, filename):
    """Plan is to create file path dynamically from models and tie it with the model itself , so that uploading row will do job for us

    Args:
        instance (_type_): _description_
        filename (_type_): _description_

    Returns:
        _type_: _description_
    """
    # file will be uploaded to MEDIA_ROOT / trainings/
    # return 'trainings/{0}}_{1}_{2}_{3}'.format(instance.Element.id, filename)
    return None  # None default for now should return filepath after creation
