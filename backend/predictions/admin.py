from django.contrib import admin
from fair.zenml.runs import is_terminal

from shared.run_endpoints import stop_runs

from .deletion import delete_prediction
from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "zenml_run_id",
        "local_model_stac_id",
        "status",
        "user",
        "submitted_at",
    ]
    list_filter = ["status", "submitted_at"]
    search_fields = ["zenml_run_id", "local_model_stac_id", "description", "user__username"]
    readonly_fields = ["zenml_run_id", "local_model_stac_id", "submitted_at", "last_polled_at"]
    date_hierarchy = "submitted_at"
    list_per_page = 50
    autocomplete_fields = ["user"]

    actions = [stop_runs]

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        running = obj is not None and not is_terminal(obj.status)
        return super().has_delete_permission(request, obj) and not running

    def delete_model(self, request, obj: Prediction) -> None:
        delete_prediction(obj)

    def delete_queryset(self, request, queryset) -> None:
        for prediction in queryset:
            delete_prediction(prediction)
