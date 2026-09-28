from rest_framework import permissions
from apps.patents.models import PatentApplicationStatus


class CanAccessDocument(permissions.BasePermission):
    """
    Object-level permission to ensure only authorized users can view, download, or manage a document.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, 'role', '')

        # Admins and superusers can access all documents
        if role == 'admin' or user.is_staff or user.is_superuser:
            return True

        patent = obj.application

        # Safe read/download operations
        if request.method in permissions.SAFE_METHODS:
            # Applicant owns the patent
            if patent.applicant_id == user.pk:
                return True
            # Assigned consultant
            if patent.assigned_to_id == user.pk:
                return True
            # Scrutinizers can view submitted/active applications
            if role == 'scrutinizer' and patent.status != PatentApplicationStatus.DRAFT:
                return True
            return False

        # Mutation operations (Update / Delete)
        if obj.uploaded_by_id == user.pk and patent.status in (PatentApplicationStatus.DRAFT, 'scrutiny_rejected'):
            return True

        return False
