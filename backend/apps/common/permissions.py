from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """
    Permission check for admin users (role == 'admin', is_staff, or is_superuser).
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, 'role', '') == 'admin'
                or getattr(request.user, 'is_staff', False)
                or getattr(request.user, 'is_superuser', False)
            )
        )
