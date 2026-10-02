"""
Audit Trail Views
=================
Read-only API endpoints for retrieving audit trails of patent applications.
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.patents.models import PatentApplication
from apps.workflow.permissions import can_view_patent
from apps.audit.selectors import get_audit_trail, get_audit_trail_count, get_patent_audits_for_user
from apps.audit.serializers import AuditEntrySerializer


class AuditTrailView(APIView):
    """
    GET /api/v1/audit/patents/{patent_id}/

    Retrieve the complete audit trail (status changes + remarks) for a patent application.
    Supports optional pagination via ?limit= and ?offset= query parameters.

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
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        if not can_view_patent(request.user, patent):
            return Response(
                {'detail': 'You do not have permission to view this patent application.'},
                status=status.HTTP_403_FORBIDDEN
            )

        limit_param = request.query_params.get('limit')
        offset_param = request.query_params.get('offset')

        limit = None
        offset = 0

        if limit_param is not None:
            try:
                limit = min(max(1, int(limit_param)), 500)
                offset = max(0, int(offset_param or 0))
            except ValueError:
                limit = None
                offset = 0

        audit_entries = get_audit_trail(patent, request.user, limit=limit, offset=offset)
        total_entries = get_audit_trail_count(patent, request.user)

        serializer = AuditEntrySerializer(audit_entries, many=True)

        return Response({
            'patent_id': patent.patent_id,
            'title': patent.title,
            'current_status': patent.status,
            'audit_trail': serializer.data,
            'total_entries': total_entries,
        })


class PatentAuditListView(APIView):
    """
    GET /api/v1/audit/

    List patents for which the user can view audit trails.
    Supports ?limit= query parameter (default 50, max 200).

    Returns:
        - List of patents the user has audit access to
        - Respects role-based access control

    Permission:
        - IsAuthenticated
        - Visibility based on user role
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request) -> Response:
        try:
            limit = int(request.query_params.get('limit', 50))
            limit = min(max(1, limit), 200)
        except ValueError:
            limit = 50

        patents = get_patent_audits_for_user(request.user, limit=limit)

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
