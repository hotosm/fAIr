import json

from django import forms
from django.contrib import admin, messages
from rest_framework.exceptions import ValidationError

from shared.integrations.stac import BASE_MODELS_COLLECTION, LOCAL_MODELS_COLLECTION, get_item

from .deletion import delete_base_model
from .models import BaseModel, Category, LocalModel
from .views import (
    _apply_metadata,
    _apply_pin,
    _metadata_properties,
    _validate_merge,
)

STAC_FIELDS = {
    "stac_title": "title",
    "stac_description": "description",
    "stac_preview": "fair_preview",
}


class StacMetadataForm(forms.ModelForm):
    """Edits the title, description and preview held on the model's published STAC item."""

    stac_collection = ""
    stac_title = forms.CharField(label="Title", required=False)
    stac_description = forms.CharField(label="Description", required=False, widget=forms.Textarea)
    stac_preview = forms.JSONField(label="Preview (fair:preview)", required=False)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.stac_edits: dict = {}
        if not self.instance.stac_item_id:
            for field in STAC_FIELDS:
                self.fields.pop(field)
            return
        properties = get_item(self.stac_collection, self.instance.stac_item_id).properties
        self.initial.update(
            stac_title=properties.get("title", ""),
            stac_description=properties.get("description", ""),
            stac_preview=properties.get("fair:preview"),
        )

    def clean(self) -> dict:
        cleaned = super().clean()
        for field, key in STAC_FIELDS.items():
            value = cleaned.get(field)
            if isinstance(value, str):
                value = value.replace("\r\n", "\n")  # browsers send textarea newlines as CRLF
            if value == self.initial.get(field):
                continue
            if value in (None, ""):
                self.add_error(field, "The STAC item keeps a value; it cannot be cleared.")
            else:
                self.stac_edits[key] = value
        if self.stac_edits and not self.errors:
            try:
                _validate_merge(
                    self.stac_collection,
                    self.instance.stac_item_id,
                    _metadata_properties(self.stac_edits),
                )
            except ValidationError as exc:
                raise forms.ValidationError(json.dumps(exc.detail)) from exc
        return cleaned

    def save(self, commit: bool = True):
        if self.stac_edits:
            _apply_metadata(self.stac_collection, self.instance.stac_item_id, self.stac_edits)
        return super().save(commit)


class BaseModelStacForm(StacMetadataForm):
    stac_collection = BASE_MODELS_COLLECTION


class LocalModelStacForm(StacMetadataForm):
    stac_collection = LOCAL_MODELS_COLLECTION


class StacModelAdmin(admin.ModelAdmin):
    """Writes pins and metadata through the API paths, so the row and its STAC item agree."""

    stac_collection = ""

    @admin.action(description="Pin selected", permissions=["change"])
    def pin(self, request, queryset) -> None:
        for model in queryset:
            _apply_pin(model, self.stac_collection, {"is_pinned": True})
        messages.info(request, f"Pinned {queryset.count()} model(s).")

    @admin.action(description="Unpin selected", permissions=["change"])
    def unpin(self, request, queryset) -> None:
        for model in queryset:
            _apply_pin(model, self.stac_collection, {"is_pinned": False})
        messages.info(request, f"Unpinned {queryset.count()} model(s).")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["slug", "label", "description"]
    search_fields = ["slug", "label"]


@admin.register(LocalModel)
class LocalModelAdmin(StacModelAdmin):
    form = LocalModelStacForm
    stac_collection = LOCAL_MODELS_COLLECTION
    actions = ["pin", "unpin"]
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
    list_editable = ["visibility", "status"]
    list_filter = ["visibility", "status", "category", "base_model", "is_pinned", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = [
        "name",
        "category",
        "base_model",
        "is_pinned",
        "stac_item_id",
        "created_at",
        "last_modified",
    ]
    list_select_related = ["base_model"]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        # A row delete would orphan the published STAC item and its versions.
        return False

    @admin.display(boolean=True, description="Promoted")
    def is_promoted(self, obj) -> bool:
        return bool(obj.stac_item_id)


@admin.register(BaseModel)
class BaseModelAdmin(StacModelAdmin):
    form = BaseModelStacForm
    stac_collection = BASE_MODELS_COLLECTION
    list_display = ["name", "category", "status", "visibility", "is_pinned", "user", "created_at"]
    list_editable = ["status", "visibility"]
    list_filter = ["status", "category", "visibility", "is_pinned", "created_at"]
    search_fields = ["name", "user__username"]
    readonly_fields = [
        "name",
        "category",
        "is_pinned",
        "stac_item_id",
        "error",
        "created_at",
        "last_modified",
    ]
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user"]
    actions = ["register_in_stac", "pin", "unpin"]

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        registering = obj is not None and obj.status == BaseModel.Status.REGISTERING
        return super().has_delete_permission(request, obj) and not registering

    def delete_model(self, request, obj: BaseModel) -> None:
        delete_base_model(obj)

    def delete_queryset(self, request, queryset) -> None:
        for base_model in queryset:
            delete_base_model(base_model)

    @admin.action(description="Re-register selected from STAC", permissions=["change"])
    def register_in_stac(self, request, queryset) -> None:
        from shared.integrations.stac import BASE_MODELS_COLLECTION, get_item

        from .tasks import register_base_model
        from .views import _pipeline_error

        enqueued = 0
        for base_model in queryset:
            if not base_model.stac_item_id:
                messages.warning(
                    request,
                    f"{base_model.name}: never published, re-submit via the API to register.",
                )
                continue
            # The full item: the cached facet drops `id`/`type` and cannot be re-registered.
            stac_item = get_item(BASE_MODELS_COLLECTION, base_model.stac_item_id).to_dict(
                include_self_link=False, transform_hrefs=False
            )
            if error := _pipeline_error(stac_item):
                messages.error(request, f"{base_model.name}: {error}")
                continue
            base_model.status = BaseModel.Status.REGISTERING
            base_model.error = ""
            base_model.save(update_fields=["status", "error", "last_modified"])
            register_base_model.enqueue(base_model_id=base_model.id, stac_item=stac_item)
            enqueued += 1
        messages.info(request, f"Enqueued {enqueued} base model(s) for registration.")
