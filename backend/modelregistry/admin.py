from django.contrib import admin, messages

from .models import BaseModel, Category, LocalModel


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["slug", "label", "description"]
    search_fields = ["slug", "label"]


@admin.register(LocalModel)
class LocalModelAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "base_model",
        "visibility",
        "status",
        "is_pinned",
        "is_promoted",
        "stac_item_id",
        "user",
        "created_at",
    ]
    list_editable = ["category", "visibility", "status", "is_pinned"]
    list_filter = ["visibility", "status", "category", "base_model", "is_pinned", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = ["stac_item_id", "created_at", "last_modified"]
    list_select_related = ["base_model"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user", "base_model"]

    @admin.display(boolean=True, description="Promoted")
    def is_promoted(self, obj) -> bool:
        return bool(obj.stac_item_id)


@admin.register(BaseModel)
class BaseModelAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "status", "visibility", "is_pinned", "user", "created_at"]
    list_editable = ["category", "status", "visibility", "is_pinned"]
    list_filter = ["status", "category", "visibility", "is_pinned", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = ["created_at", "last_modified"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
    actions = ["register_in_stac"]

    @admin.action(description="Re-register selected from STAC")
    def register_in_stac(self, request, queryset) -> None:
        from shared.integrations.stac import BASE_MODELS_COLLECTION, get_cached_item

        from .tasks import register_base_model

        enqueued = 0
        for base_model in queryset:
            if not base_model.stac_item_id:
                messages.warning(
                    request,
                    f"{base_model.name}: never published, re-submit via the API to register.",
                )
                continue
            stac_item = get_cached_item(BASE_MODELS_COLLECTION, base_model.stac_item_id)
            base_model.status = BaseModel.Status.REGISTERING
            base_model.error = ""
            base_model.save(update_fields=["status", "error", "last_modified"])
            register_base_model.enqueue(base_model_id=base_model.id, stac_item=stac_item)
            enqueued += 1
        messages.info(request, f"Enqueued {enqueued} base model(s) for registration.")
