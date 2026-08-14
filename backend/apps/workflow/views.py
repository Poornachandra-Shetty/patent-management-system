from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.patents.models import PatentApplication
from apps.workflow.exceptions import WorkflowError, http_status_for
from apps.workflow.models import WorkflowEvent
from apps.workflow.permissions import can_act_on_patent, can_view_patent
from apps.workflow.serializers import (
    AllowedTransitionsSerializer,
    TransitionRequestSerializer,
    WorkflowEventSerializer,
)
from apps.workflow.services import transition_patent
from apps.workflow.state_machine import TERMINAL_STATES, get_allowed_transitions


def _workflow_error_response(exc: WorkflowError) -> Response:
    return Response({'detail': str(exc)}, status=http_status_for(exc))


class TransitionView(APIView):
    """
    POST /api/v1/workflow/{patent_id}/transition/

    Transition a patent application to a new status.
    The allowed target statuses depend on the current status and the caller's role.

    Request body:
        {
            "to_status": "<target_status>",
            "note": "<optional note>",
            "consultant_id": <required when to_status is forwarded_to_consultant>
        }

    Response 200:
        The created WorkflowEvent.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, patent_id: str) -> Response:
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        serializer = TransitionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            event = transition_patent(
                patent=patent,
                to_status=serializer.validated_data['to_status'],
                performed_by=request.user,
                note=serializer.validated_data.get('note', ''),
                consultant_id=serializer.validated_data.get('consultant_id'),
            )
        except WorkflowError as exc:
            return _workflow_error_response(exc)

        return Response(WorkflowEventSerializer(event).data, status=status.HTTP_200_OK)


class AllowedTransitionsView(APIView):
    """
    GET /api/v1/workflow/{patent_id}/allowed/

    Returns the transitions the current user may perform on this patent.
    Useful for rendering action buttons in the frontend.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, patent_id: str) -> Response:
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        if not can_view_patent(request.user, patent):
            return Response(
                {'detail': 'You do not have permission to view this patent application.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        role: str = request.user.role  # type: ignore[union-attr]
        allowed = get_allowed_transitions(patent.status, role)

        if not can_act_on_patent(request.user, patent):
            allowed = []

        payload = {
            'patent_id': patent.patent_id,
            'current_status': patent.status,
            'allowed_transitions': allowed,
            'is_terminal': patent.status in TERMINAL_STATES,
        }
        return Response(AllowedTransitionsSerializer(payload).data)


class WorkflowHistoryView(generics.ListAPIView):
    """
    GET /api/v1/workflow/{patent_id}/history/

    Returns the full transition history for a patent application,
    ordered from most recent to oldest.
    """
    serializer_class = WorkflowEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patent_id = self.kwargs['patent_id']
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        if not can_view_patent(self.request.user, patent):
            return WorkflowEvent.objects.none()

        return WorkflowEvent.objects.filter(application=patent).select_related(
            'performed_by', 'application'
        )

    def list(self, request, *args, **kwargs):
        patent_id = self.kwargs['patent_id']
        patent = get_object_or_404(PatentApplication, patent_id=patent_id)

        if not can_view_patent(request.user, patent):
            return Response(
                {'detail': 'You do not have permission to view this patent application.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().list(request, *args, **kwargs)
