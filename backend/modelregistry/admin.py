from django.contrib import admin

from .models import LocalModel


@admin.register(LocalModel)
class LocalModelAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "user", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = ["created_at", "last_modified"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
