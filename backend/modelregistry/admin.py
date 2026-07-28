from django.contrib import admin, messages

from .models import BaseModel, LocalModel


@admin.register(LocalModel)
class LocalModelAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "user", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = ["created_at", "last_modified"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]


@admin.register(BaseModel)
class BaseModelAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "status", "visibility", "user", "created_at"]
    list_editable = ["category", "status", "visibility"]
    list_filter = ["status", "category", "visibility", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = ["created_at", "last_modified"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
    actions = ["register_in_stac"]

    @admin.action(description="Register / re-register selected in STAC")
    def register_in_stac(self, request, queryset) -> None:
        from .tasks import register_base_model

        enqueued = 0
        for base_model in queryset:
            if not base_model.stac_item:
                messages.warning(request, f"{base_model.name}: no stac_item stored, skipped")
                continue
            base_model.status = BaseModel.Status.REGISTERING
            base_model.error = ""
            base_model.save(update_fields=["status", "error", "last_modified"])
            register_base_model.enqueue(base_model_id=base_model.id)
            enqueued += 1
        messages.info(request, f"Enqueued {enqueued} base model(s) for registration.")
