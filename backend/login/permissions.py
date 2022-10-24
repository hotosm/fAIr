# permissions.py

from rest_framework import permissions


class IsOsmAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):

        permission_allowed_methods = getattr(view, "permission_allowed_methods", [])
        if request.method in permission_allowed_methods: # if request method is set to allowed give them permission
            return True
        if request.user:
            return True

        return False