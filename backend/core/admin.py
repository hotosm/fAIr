from django.contrib import admin
from django.contrib.gis import admin as geoadmin

from .models import (
    AOI,
    Banner,
    Dataset,
    Feedback,
    Label,
    Model,
    Prediction,
    Training,
    UserNotification,
)

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


@admin.register(Feedback)
class FeedbackAdmin(geoadmin.GISModelAdmin):
    list_display = [
        "id",
        "get_training_id",
        "action",
        "user",
        "created_at",
    ]
    list_filter = ["action", "created_at"]
    search_fields = ["user__username", "comments"]

    def get_training_id(self, obj):
        return obj.training.id if obj.training else "N/A"

    get_training_id.short_description = "Training"


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


@admin.register(AOI)
class AOIAdmin(geoadmin.GISModelAdmin):
    list_display = ["id", "get_dataset_id", "label_status", "user", "created_at"]
    list_filter = ["label_status", "created_at"]

    def get_dataset_id(self, obj):
        return obj.dataset.id

    get_dataset_id.short_description = "Dataset"


@admin.register(Prediction)
class PredictionAdmin(geoadmin.GISModelAdmin):
    list_display = ["id", "description", "status", "result", "user", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["description", "user__username"]


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "message", "is_read", "created_at"]
    list_filter = ["is_read", "created_at"]
    search_fields = ["user__username", "message"]
