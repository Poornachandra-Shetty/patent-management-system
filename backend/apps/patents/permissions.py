from rest_framework import permissions
from apps.patents.models import PatentApplicationStatus


class IsPatentOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow read access to authorized users,
    and modification/deletion only to the applicant when patent is in editable state (or admin).
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
                return obj.applicant_id == user.pk
            if role == 'consultant':
                return obj.assigned_to_id == user.pk
            if role == 'scrutinizer':
                return obj.status != PatentApplicationStatus.DRAFT
            return False

        # Mutation operations (PUT, PATCH, DELETE)
        # Only the applicant who owns the application can edit or delete
        if obj.applicant_id != user.pk:
            return False

        # Deletion is strictly restricted to DRAFT status
        if request.method == 'DELETE':
            return obj.status == PatentApplicationStatus.DRAFT

        # Updates are strictly restricted to DRAFT status
        return obj.status == PatentApplicationStatus.DRAFT
