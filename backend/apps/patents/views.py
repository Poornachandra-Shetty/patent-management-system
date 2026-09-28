from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.patents.serializers import (
    PatentApplicationListSerializer,
    PatentApplicationDetailSerializer,
    PatentApplicationCreateSerializer,
)
from apps.patents.permissions import IsPatentOwnerOrReadOnly
from apps.workflow.exceptions import WorkflowError, http_status_for
from apps.workflow.services import transition_patent


class PatentApplicationViewSet(viewsets.ModelViewSet):
    queryset = PatentApplication.objects.select_related('applicant', 'department', 'assigned_to').prefetch_related('inventors').all()
    permission_classes = [permissions.IsAuthenticated, IsPatentOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'department', 'category']
    search_fields = ['patent_id', 'title', 'keywords', 'abstract']
    ordering_fields = ['created_at', 'updated_at', 'patent_id']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PatentApplicationCreateSerializer
        elif self.action in ['list']:
            return PatentApplicationListSerializer
        return PatentApplicationDetailSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')
        queryset = super().get_queryset()

        if role == 'admin' or user.is_staff or user.is_superuser:
            return queryset
        elif role == 'applicant':
            return queryset.filter(applicant=user)
        elif role == 'consultant':
            return queryset.filter(assigned_to=user)
        elif role == 'scrutinizer':
            return queryset.exclude(status=PatentApplicationStatus.DRAFT)
        return queryset.none()

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        role = getattr(user, 'role', '')

        # Enforce state immutability
        if role != 'admin' and instance.status != PatentApplicationStatus.DRAFT:
            raise PermissionDenied("Patent application cannot be modified while under formal evaluation.")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        role = getattr(user, 'role', '')

        if role != 'admin' and instance.status != PatentApplicationStatus.DRAFT:
            raise PermissionDenied("Submitted or evaluated patent applications cannot be deleted.")

        instance.delete()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Transition status from draft to submitted via the workflow service."""
        patent = self.get_object()

        try:
            transition_patent(
                patent=patent,
                to_status=PatentApplicationStatus.SUBMITTED,
                performed_by=request.user,
            )
        except WorkflowError as exc:
            return Response({'detail': str(exc)}, status=http_status_for(exc))

        patent.refresh_from_db()
        serializer = PatentApplicationDetailSerializer(patent)
        return Response(serializer.data)
