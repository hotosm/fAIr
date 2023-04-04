from django.contrib import admin
from django.contrib.gis import admin as geoadmin

from .models import *

# Register your models here.


@admin.register(Dataset)
class DatasetAdmin(geoadmin.GeoModelAdmin):
    list_display = ["name", "created_by"]


@admin.register(Model)
class ModelAdmin(geoadmin.GeoModelAdmin):
    list_display = ["get_dataset_id", "name", "status", "created_at"]

    def get_dataset_id(self, obj):
        return obj.dataset.id

    get_dataset_id.short_description = "Dataset"


@admin.register(Training)
class TrainingAdmin(geoadmin.GeoModelAdmin):
    list_display = [
        "get_model_id",
        "description",
        "status",
        "zoom_level",
        "created_by",
        "accuracy",
    ]
    list_filter = ["status"]

    def get_model_id(self, obj):
        return obj.model.id

    get_model_id.short_description = "Model"
