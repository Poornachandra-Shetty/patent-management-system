from rest_framework import permissions
from apps.patents.models import PatentApplicationStatus


class CanAccessRemark(permissions.BasePermission):
    """
    Object-level permission ensuring users only see, post, and modify remarks within their domain.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, 'role', '')

        # Admins have full access
        if role == 'admin' or user.is_staff or user.is_superuser:
            return True

        # Safe read operations
        if request.method in permissions.SAFE_METHODS:
            if role == 'applicant':
                return obj.visible_to_applicant and obj.application.applicant_id == user.pk
            if role == 'consultant':
                return obj.application.assigned_to_id == user.pk or obj.user_id == user.pk
            if role == 'scrutinizer':
                return obj.application.status != PatentApplicationStatus.DRAFT
            return False

        # Mutation operations (edit/delete)
        # Only the author can edit or delete their remark
        return obj.user_id == user.pk
