"""
Audit Trail Views
=================
Read-only API endpoints for retrieving audit trails of patent applications.
"""

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.patents.models import PatentApplication
from apps.workflow.permissions import can_view_patent
from apps.audit.selectors import get_audit_trail, get_patent_audits_for_user
from apps.audit.serializers import AuditEntrySerializer


class AuditTrailView(APIView):
    """
    GET /api/v1/audit/patents/{patent_id}/

    Retrieve the complete audit trail (status changes + remarks) for a patent application.

    Returns:
        - Chronologically ordered list of audit entries
        - Each entry identifies its type (status_change or remark)
        - Respects visibility rules (e.g., applicants don't see internal remarks)

    Permission:
        - IsAuthenticated
        - User must have view permission on the patent (via can_view_patent)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patent_id: str) -> Response:
        # Fetch the patent application
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        # Check if user is authorized to view this patent's audit trail
        if not can_view_patent(request.user, patent):
            return Response(
                {'detail': 'You do not have permission to view this patent application.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get audit trail data
        audit_entries = get_audit_trail(patent, request.user)

        # Serialize the entries
        serializer = AuditEntrySerializer(audit_entries, many=True)

        return Response({
            'patent_id': patent.patent_id,
            'title': patent.title,
            'current_status': patent.status,
            'audit_trail': serializer.data,
            'total_entries': len(audit_entries),
        })


class PatentAuditListView(APIView):
    """
    GET /api/v1/audit/

    List patents for which the user can view audit trails.

    Returns:
        - List of patents the user has audit access to
        - Respects role-based access control

    Permission:
        - IsAuthenticated
        - Visibility based on user role
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request) -> Response:
        # Get patents where user has audit access
        patents = get_patent_audits_for_user(request.user)

        # Simple serialization of patent info
        patents_data = [
            {
                'id': patent.id,
                'patent_id': patent.patent_id,
                'title': patent.title,
                'status': patent.status,
                'applicant_name': patent.applicant.name,
                'created_at': patent.created_at,
                'updated_at': patent.updated_at,
            }
            for patent in patents
        ]

        return Response({
            'role': request.user.role,
            'auditable_patents': patents_data,
            'total': len(patents_data),
        })
