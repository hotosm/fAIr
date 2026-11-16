from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .deletion import DELETED_USER_OSM_ID, delete_account, has_work_in_progress
from .models import OsmUser


@admin.register(OsmUser)
class OsmUserAdmin(UserAdmin):
    list_display = [
        "osm_id",
        "username",
        "email",
        "is_staff",
        "is_superuser",
        "account_deletion_requested",
        "last_login",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active", "account_deletion_requested"]
    search_fields = ["username", "email", "osm_id"]
    readonly_fields = ["last_login", "date_joined"]

    fieldsets = (
        (None, {"fields": ("username", "password", "osm_id", "email", "img_url")}),
        (
            "Profile",
            {"fields": ("email_verified", "newsletter_subscription", "account_deletion_requested")},
        ),
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
                    "osm_id",
                    "email",
                    "usable_password",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    def get_changeform_initial_data(self, request):
        return {**super().get_changeform_initial_data(request), "usable_password": "false"}

    def get_deleted_objects(self, objs, request):
        # Kept records are not deleted; `protected` blocks the placeholder and busy users.
        users = [str(user) for user in objs]
        protected = [
            str(user)
            for user in objs
            if user.osm_id == DELETED_USER_OSM_ID or has_work_in_progress(user)
        ]
        return users, {"users": len(users)}, set(), protected

    def delete_model(self, request, obj: OsmUser) -> None:
        delete_account(obj)

    def delete_queryset(self, request, queryset) -> None:
        for user in queryset:
            delete_account(user)
