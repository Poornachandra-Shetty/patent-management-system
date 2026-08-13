from rest_framework import viewsets, permissions
from apps.departments.models import Department
from apps.departments.serializers import DepartmentSerializer

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]
