from django.contrib import admin

from shared.run_endpoints import stop_runs
from shared.run_status import is_terminal

from .models import TrainingRunRef


@admin.register(TrainingRunRef)
class TrainingRunRefAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "zenml_run_id",
        "local_model",
        "base_model_stac_id",
        "dataset",
        "status",
        "user",
        "submitted_at",
    ]
    list_filter = ["status", "submitted_at"]
    search_fields = [
        "zenml_run_id",
        "local_model__stac_id",
        "base_model_stac_id",
        "user__username",
    ]
    readonly_fields = ["zenml_run_id", "base_model_stac_id", "submitted_at", "last_polled_at"]
    date_hierarchy = "submitted_at"
    list_per_page = 50
    autocomplete_fields = ["local_model", "dataset", "user"]

    actions = [stop_runs]

    def after_cancel(self, pk: int) -> None:
        return None

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        running = obj is not None and not is_terminal(obj.status)
        return super().has_delete_permission(request, obj) and not running
