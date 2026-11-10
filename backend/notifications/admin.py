from django.contrib import admin

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["message", "start_date", "end_date", "is_currently_displayable"]
    list_filter = ["start_date", "end_date"]
    search_fields = ["message"]
    list_per_page = 50

    @admin.display(boolean=True, description="Currently displayable")
    def is_currently_displayable(self, obj: Banner) -> bool:
        return obj.is_displayable()
