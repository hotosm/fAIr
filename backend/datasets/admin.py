from django.contrib.gis import admin as geoadmin

from .models import AOI, Dataset


@geoadmin.register(Dataset)
class DatasetAdmin(geoadmin.GISModelAdmin):
    list_display = ["title", "stac_id", "status", "visibility", "user", "created_at"]
    list_filter = ["status", "visibility", "created_at"]
    search_fields = ["title", "stac_id", "user__username"]
    readonly_fields = ["created_at", "last_modified"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]


@geoadmin.register(AOI)
class AOIAdmin(geoadmin.GISModelAdmin):
    list_display = ["id", "dataset", "user", "created_at"]
    list_filter = ["created_at"]
    readonly_fields = ["created_at", "last_modified"]
    autocomplete_fields = ["dataset", "user"]
    list_per_page = 50
