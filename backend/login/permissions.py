# permissions.py

from rest_framework import permissions


class IsOsmAuthenticated(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.user: # if user is authenticated give him permission
            return True


        if request.user.is_superuser:
            return True

        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_staff and request.method not in self.edit_methods:
            return True

        return False