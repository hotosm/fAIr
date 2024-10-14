from django import forms
from django.contrib import admin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db import models

from .models import OsmUser


class OsmUserCreationForm(UserCreationForm):
    class Meta:
        model = OsmUser
        fields = (
            "username",
            "email",
            "osm_id",
            "img_url",
            "is_staff",
            "is_superuser",
            "is_active",
        )


class OsmUserChangeForm(UserChangeForm):
    class Meta:
        model = OsmUser
        fields = (
            "username",
            "email",
            "osm_id",
            "img_url",
            "is_staff",
            "is_superuser",
            "is_active",
        )


@admin.register(OsmUser)
class OsmUserAdmin(admin.ModelAdmin):
    add_form = OsmUserCreationForm
    form = OsmUserChangeForm
    model = OsmUser

    list_display = [
        "osm_id",
        "username",
        "email",
        "is_staff",
        "is_superuser",
        "last_login",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active"]
    search_fields = ["username", "email", "osm_id"]
    readonly_fields = ["last_login", "date_joined"]

    fieldsets = (
        (None, {"fields": ("username", "osm_id", "email", "img_url")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "osm_id",
                    "img_url",
                    "is_staff",
                    "is_superuser",
                    "is_active",
                ),
            },
        ),
    )
    formfield_overrides = {
        models.CharField: {"validators": []},
    }
