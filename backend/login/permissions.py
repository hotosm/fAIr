# permissions.py

from rest_framework import permissions


class IsOsmAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):

        public_methods = getattr(view, "public_methods", [])
        if request.method in public_methods:
            return True
        # If the user is authenticated, allow access
        if request.user and request.user.is_authenticated:
            # Global access for staff and admin users
            if request.user.is_staff or request.user.is_superuser:
                return True

            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Allow read-only access for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow modification (PUT, DELETE) if the user is staff or admin
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check if the object has a 'creator' field and if the user is the creator
        if hasattr(obj, "creator") and obj.creator == request.user:
            return True

        return False


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff
