from django.contrib import admin
from django.contrib.gis import admin as geoadmin

from .models import *

# Register your models here.


@admin.register(Dataset)
class DatasetAdmin(geoadmin.GeoModelAdmin):
    list_display = ["name", "created_by"]


@admin.register(AOI)
class AOIAdmin(geoadmin.GeoModelAdmin):
    list_display = ["dataset", "created_at"]


@admin.register(Label)
class LabelAdmin(geoadmin.GeoModelAdmin):
    list_display = ["aoi", "created_at"]
