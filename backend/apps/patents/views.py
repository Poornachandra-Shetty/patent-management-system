from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.patents.serializers import (
    PatentApplicationListSerializer,
    PatentApplicationDetailSerializer,
    PatentApplicationCreateSerializer
)

class PatentApplicationViewSet(viewsets.ModelViewSet):
    queryset = PatentApplication.objects.select_related('applicant', 'department', 'assigned_to').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'department', 'category']
    search_fields = ['patent_id', 'title', 'keywords', 'abstract']
    ordering_fields = ['created_at', 'updated_at', 'patent_id']

    def get_serializer_class(self):
        if self.action == 'create':
            return PatentApplicationCreateSerializer
        elif self.action in ['list']:
            return PatentApplicationListSerializer
        return PatentApplicationDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Role-based scoping
        if user.role == 'applicant':
            return queryset.filter(applicant=user)
        elif user.role == 'consultant':
            return queryset.filter(assigned_to=user)
        # Scrutinizers & Admins can see all submitted/in-progress applications
        return queryset

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Transition status from draft to submitted"""
        patent = self.get_object()
        if patent.status != PatentApplicationStatus.DRAFT:
            return Response(
                {"detail": "Only draft applications can be submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        patent.status = PatentApplicationStatus.SUBMITTED
        patent.save()
        serializer = PatentApplicationDetailSerializer(patent)
        return Response(serializer.data)
