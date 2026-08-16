from rest_framework import viewsets, permissions
from apps.reviews.models import Remark
from apps.reviews.serializers import RemarkSerializer

class RemarkViewSet(viewsets.ModelViewSet):
    queryset = Remark.objects.all()
    serializer_class = RemarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        remark = serializer.save(user=self.request.user)

        # Create notification for remark
        try:
            from apps.notifications.services import create_remark_notification
            create_remark_notification(remark=remark)
        except ImportError:
            # Notifications app not available
            pass

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        # Hide internal remarks from applicants
        if user.role == 'applicant':
            return queryset.filter(visible_to_applicant=True, application__applicant=user)
        return queryset
