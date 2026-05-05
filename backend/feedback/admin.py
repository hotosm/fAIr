from django.contrib.gis import admin as geoadmin

from .models import Feedback


@geoadmin.register(Feedback)
class FeedbackAdmin(geoadmin.GISModelAdmin):
    list_display = ["id", "stac_id", "action", "user", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["stac_id", "user__username", "comments"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
