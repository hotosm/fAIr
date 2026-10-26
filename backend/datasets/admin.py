from django.contrib.gis import admin as geoadmin

from .deletion import delete_dataset
from .models import AOI, Dataset


@geoadmin.register(Dataset)
class DatasetAdmin(geoadmin.GISModelAdmin):
    list_display = ["title", "stac_id", "category", "status", "visibility", "user", "created_at"]
    list_filter = ["category", "status", "visibility", "created_at"]
    search_fields = ["title", "stac_id", "user__username"]
    readonly_fields = [
        "title",
        "category",
        "imagery",
        "primary_input",
        "stac_id",
        "created_at",
        "last_modified",
    ]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        building = obj is not None and obj.status == Dataset.Status.BUILDING
        return super().has_delete_permission(request, obj) and not building

    def delete_model(self, request, obj: Dataset) -> None:
        delete_dataset(obj)

    def delete_queryset(self, request, queryset) -> None:
        for dataset in queryset:
            delete_dataset(dataset)


@geoadmin.register(AOI)
class AOIAdmin(geoadmin.GISModelAdmin):
    list_display = ["id", "dataset", "user", "created_at"]
    list_filter = ["created_at"]
    readonly_fields = ["created_at", "last_modified"]
    autocomplete_fields = ["dataset", "user"]
    list_per_page = 50
