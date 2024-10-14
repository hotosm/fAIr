from django.contrib import admin
from django.contrib.gis import admin as geoadmin

from .models import *

# Register your models here.


@admin.register(Dataset)
class DatasetAdmin(geoadmin.OSMGeoAdmin):
    list_display = ["name", "created_by"]


@admin.register(Model)
class ModelAdmin(geoadmin.OSMGeoAdmin):
    list_display = ["get_dataset_id", "name", "status", "created_at", "created_by"]

    def get_dataset_id(self, obj):
        return obj.dataset.id

    get_dataset_id.short_description = "Dataset"


@admin.register(Training)
class TrainingAdmin(geoadmin.OSMGeoAdmin):
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


@admin.register(FeedbackAOI)
class FeedbackAOIAdmin(geoadmin.OSMGeoAdmin):
    list_display = ["training", "user"]


@admin.register(Feedback)
class FeedbackAdmin(geoadmin.OSMGeoAdmin):
    list_display = ["feedback_type", "training", "user", "created_at"]


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("message", "start_date", "end_date", "is_active", "is_displayable")
    list_filter = ("is_active", "start_date", "end_date")
    search_fields = ("message",)
    readonly_fields = ("is_displayable",)

    def is_displayable(self, obj):
        return obj.is_displayable()

    is_displayable.boolean = True
    is_displayable.short_description = "Currently Displayable"
