from django.contrib import admin
from django.contrib.gis import admin as geoadmin

from .models import *

# Register your models here.


@admin.register(Dataset)
class DatasetAdmin(geoadmin.GISModelAdmin):
    list_display = ["name", "user"]


@admin.register(Model)
class ModelAdmin(geoadmin.GISModelAdmin):
    list_display = ["get_dataset_id", "name", "status", "created_at", "user"]

    def get_dataset_id(self, obj):
        return obj.dataset.id

    get_dataset_id.short_description = "Dataset"


@admin.register(Training)
class TrainingAdmin(geoadmin.GISModelAdmin):
    list_display = [
        "get_model_id",
        "description",
        "status",
        "zoom_level",
        "user",
        "accuracy",
    ]
    list_filter = ["status"]

    def get_model_id(self, obj):
        return obj.model.id

    get_model_id.short_description = "Model"


@admin.register(FeedbackAOI)
class FeedbackAOIAdmin(geoadmin.GISModelAdmin):
    list_display = ["training", "user"]


@admin.register(Feedback)
class FeedbackAdmin(geoadmin.GISModelAdmin):
    list_display = ["feedback_type", "training", "user", "created_at"]


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("message", "start_date", "end_date", "is_displayable")
    list_filter = ("start_date", "end_date")
    search_fields = ("message",)
    readonly_fields = ("is_displayable",)

    def is_displayable(self, obj):
        return obj.is_displayable()

    is_displayable.boolean = True
    is_displayable.short_description = "Currently Displayable"
