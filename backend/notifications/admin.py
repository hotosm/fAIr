from django.contrib import admin
from django.utils import timezone

from .models import Banner, UserNotification


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["message", "start_date", "end_date", "is_currently_displayable"]
    list_filter = ["start_date", "end_date"]
    search_fields = ["message"]
    list_per_page = 50

    @admin.display(boolean=True, description="Currently displayable")
    def is_currently_displayable(self, obj: Banner) -> bool:
        return obj.is_displayable()


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "message", "is_read", "created_at"]
    list_filter = ["is_read", "created_at"]
    search_fields = ["user__username", "message"]
    readonly_fields = ["created_at", "read_at"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
    actions = ["mark_selected_as_read"]

    @admin.action(description="Mark selected notifications as read")
    def mark_selected_as_read(self, request, queryset) -> None:
        queryset.filter(is_read=False).update(is_read=True, read_at=timezone.now())
