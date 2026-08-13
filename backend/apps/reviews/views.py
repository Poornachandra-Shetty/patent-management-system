from rest_framework import viewsets, permissions
from apps.reviews.models import Remark
from apps.reviews.serializers import RemarkSerializer

class RemarkViewSet(viewsets.ModelViewSet):
    queryset = Remark.objects.all()
    serializer_class = RemarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        # Hide internal remarks from applicants
        if user.role == 'applicant':
            return queryset.filter(visible_to_applicant=True, application__applicant=user)
        return queryset
