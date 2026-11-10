from django import forms
from django.contrib import admin, messages
from rest_framework.exceptions import ValidationError

from shared.integrations.stac import BASE_MODELS_COLLECTION, LOCAL_MODELS_COLLECTION, get_item

from .deletion import delete_base_model
from .models import BaseModel, Category, LocalModel
from .serializers import BaseModelRegisterSerializer, StacPropertiesPatchSerializer
from .views import (
    _apply_pin,
    _merge_validate_write,
    _metadata_properties,
    _validate_merge,
    resolve_stac_item,
    start_registration,
)

STAC_FIELDS = {
    "stac_title": "title",
    "stac_description": "description",
    "stac_preview": "fair_preview",
}


STAC_FORM_FIELDS = [*STAC_FIELDS, "stac_patch"]


def _messages(detail) -> list[str]:
    if isinstance(detail, dict):
        return [message for value in detail.values() for message in _messages(value)]
    if isinstance(detail, list):
        return [message for value in detail for message in _messages(value)]
    return [str(detail)]


class StacMetadataForm(forms.ModelForm):
    """Edits the published STAC item: title, description, preview, or a `PATCH /…/stac/` body."""

    stac_collection = ""
    stac_title = forms.CharField(label="Title", required=False)
    stac_description = forms.CharField(label="Description", required=False, widget=forms.Textarea)
    stac_preview = forms.JSONField(label="Preview (fair:preview)", required=False)
    stac_patch = forms.JSONField(
        label="STAC patch",
        required=False,
        help_text='{"properties": {...}, "assets": {...}, "stac_extensions": [...]}, '
        "shallow-merged onto the item.",
    )

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.stac_edits: dict = {}
        self.stac_write: dict = {"properties": {}, "assets": None, "stac_extensions": []}
        if not self.instance.stac_item_id:
            for field in STAC_FORM_FIELDS:
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
        if patch := cleaned.get("stac_patch"):
            serializer = StacPropertiesPatchSerializer(data=patch)
            if not serializer.is_valid():
                raise forms.ValidationError(_messages(serializer.errors))
            self.stac_write.update(serializer.validated_data)
        self.stac_write["properties"] = {
            **_metadata_properties(self.stac_edits),
            **self.stac_write["properties"],
        }
        if self._has_stac_changes() and not self.errors:
            try:
                _validate_merge(self.stac_collection, self.instance.stac_item_id, **self.stac_write)
            except ValidationError as exc:
                raise forms.ValidationError(_messages(exc.detail)) from exc
        return cleaned

    def _has_stac_changes(self) -> bool:
        return bool(self.stac_write["properties"] or self.stac_write["assets"])

    def save(self, commit: bool = True):
        if self._has_stac_changes():
            item_id = self.instance.stac_item_id
            _merge_validate_write(self.stac_collection, item_id, **self.stac_write)
        return super().save(commit)


class BaseModelStacForm(StacMetadataForm):
    stac_collection = BASE_MODELS_COLLECTION


class LocalModelStacForm(StacMetadataForm):
    stac_collection = LOCAL_MODELS_COLLECTION


class BaseModelRegisterForm(forms.ModelForm):
    stac_item = forms.JSONField(
        label="STAC item", required=False, help_text="The STAC item JSON, or give a URL."
    )
    stac_item_url = forms.URLField(label="STAC item URL", required=False)
    inference_endpoint = forms.URLField(
        required=False, help_text="Replaces the item's mlm:inference-endpoint asset."
    )

    class Meta:
        model = BaseModel
        fields = ["category"]

    def clean(self) -> dict:
        cleaned = super().clean()
        data = {key: value for key, value in cleaned.items() if value}
        if category := data.get("category"):
            data["category"] = category.slug
        serializer = BaseModelRegisterSerializer(data=data)
        if not serializer.is_valid():
            raise forms.ValidationError(_messages(serializer.errors))
        try:
            self.resolved_item = resolve_stac_item(serializer.validated_data)
        except ValidationError as exc:
            raise forms.ValidationError(_messages(exc.detail)) from exc
        return cleaned


class StacModelAdmin(admin.ModelAdmin):
    """Writes pins and metadata through the API paths, so the row and its STAC item agree."""

    stac_collection = ""

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if obj is None or obj.stac_item_id:
            return fields
        return [field for field in fields if field not in STAC_FORM_FIELDS]

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
    add_fieldsets = [
        (None, {"fields": ["stac_item", "stac_item_url", "inference_endpoint", "category"]})
    ]

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = BaseModelRegisterForm
        return super().get_form(request, obj, **kwargs)

    def get_fieldsets(self, request, obj=None):
        return self.add_fieldsets if obj is None else super().get_fieldsets(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return [] if obj is None else self.readonly_fields

    def save_model(self, request, obj: BaseModel, form, change: bool) -> None:
        if change:
            super().save_model(request, obj, form, change)
            return
        obj.pk = start_registration(form.resolved_item, request.user).pk
        obj.refresh_from_db()

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
