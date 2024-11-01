# permissions.py

from rest_framework import permissions


class IsOsmAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):

        public_methods = getattr(view, "public_methods", [])
        if request.method in public_methods:
            return True

        if request.user and request.user.is_authenticated:
            # if request.user.is_staff or request.user.is_superuser:
            #     return True
            return True

        return False

    def has_object_permission(self, request, view, obj):

        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow modification (PUT, DELETE) if the user is staff or admin
        if request.user.is_staff or request.user.is_superuser:
            return True
        ## if the object it is trying to access has user info
        if request.user and request.user.is_authenticated:
            authenticated_user_allowed_methods = getattr(
                view, "authenticated_user_allowed_methods", []
            )
            if request.method in authenticated_user_allowed_methods:
                return True

        if hasattr(obj, "user"):
            # in order to change it it needs to be in his/her name
            if obj.user == request.user:
                return True

        return False


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        public_methods = getattr(view, "public_methods", [])
        if request.method in public_methods:
            return True
        return (
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        public_methods = getattr(view, "public_methods", [])
        if request.method in public_methods:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff
