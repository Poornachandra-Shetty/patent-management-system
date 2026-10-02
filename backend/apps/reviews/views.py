from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from apps.reviews.models import Remark, RemarkAction
from apps.reviews.serializers import RemarkSerializer
from apps.reviews.permissions import CanAccessRemark
from apps.patents.models import PatentApplicationStatus


class RemarkViewSet(viewsets.ModelViewSet):
    queryset = Remark.objects.select_related('application', 'user').all()
    serializer_class = RemarkSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessRemark]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['application', 'action', 'visible_to_applicant']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', '')
        application = serializer.validated_data.get('application')

        if role == 'applicant':
            if application.applicant_id != user.pk:
                raise PermissionDenied("You can only add remarks to your own patent applications.")
            # Applicants can only add general comments and cannot hide from themselves
            remark = serializer.save(
                user=user,
                action=RemarkAction.COMMENT,
                visible_to_applicant=True
            )
        elif role == 'consultant':
            if application.assigned_to_id != user.pk and role != 'admin':
                raise PermissionDenied("You are not assigned to evaluate this patent application.")
            remark = serializer.save(user=user)
        else:
            remark = serializer.save(user=user)

        # Trigger notification if available
        try:
            from apps.notifications.services import create_remark_notification
            create_remark_notification(remark=remark)
        except ImportError:
            pass

    def perform_update(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', '')

        if role == 'applicant':
            # Ensure applicant cannot mutate action or visibility on update
            serializer.save(
                action=RemarkAction.COMMENT,
                visible_to_applicant=True
            )
        else:
            serializer.save()

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')
        queryset = super().get_queryset()

        if role == 'admin' or user.is_staff or user.is_superuser:
            return queryset
        elif role == 'applicant':
            return queryset.filter(visible_to_applicant=True, application__applicant=user)
        elif role == 'consultant':
            return queryset.filter(Q(application__assigned_to=user) | Q(user=user))
        elif role == 'scrutinizer':
            return queryset.exclude(application__status=PatentApplicationStatus.DRAFT)

        return queryset.none()
