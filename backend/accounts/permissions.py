from rest_framework import permissions


def _is_admin(user) -> bool:
    return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))


class IsAdmin(permissions.BasePermission):
    """Authenticated staff/superuser only."""

    def has_permission(self, request, view) -> bool:
        return _is_admin(request.user)


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level: only the owner (`obj.user`) or an admin may act."""

    def has_object_permission(self, request, view, obj) -> bool:
        if _is_admin(request.user):
            return True
        return getattr(obj, "user", None) == request.user


class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """Object-level: anyone reads (SAFE_METHODS); only owner/admin writes."""

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        if _is_admin(request.user):
            return True
        return getattr(obj, "user", None) == request.user
