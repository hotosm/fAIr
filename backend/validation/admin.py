from django.contrib import admin

from shared.storage import StoragePaths, remove_dir

from .models import ValidationAnswer, ValidationProject


def _delete_project(project: ValidationProject) -> None:
    remove_dir(StoragePaths.validation_dir_uri(project.id))
    project.delete()


@admin.register(ValidationProject)
class ValidationProjectAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "type",
        "status",
        "build_status",
        "source_ids",
        "user",
        "created_at",
    ]
    list_filter = ["type", "status", "build_status"]
    search_fields = ["title", "user__username"]
    autocomplete_fields = ["user"]

    def delete_model(self, request, obj: ValidationProject) -> None:
        _delete_project(obj)

    def delete_queryset(self, request, queryset) -> None:
        for project in queryset:
            _delete_project(project)


@admin.register(ValidationAnswer)
class ValidationAnswerAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "tile_id", "respondent", "valid", "updated_at"]
    list_filter = ["valid"]
    list_select_related = ["project"]
