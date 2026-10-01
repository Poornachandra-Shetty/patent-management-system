from rest_framework import generics, permissions, viewsets
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.authentication.serializers import (
    UserSerializer,
    AdminUserSerializer,
    RegisterSerializer,
    EmailTokenObtainPairSerializer,
)
from apps.common.permissions import IsAdminRole

User = get_user_model()


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for full user management including role assignments.
    """
    queryset = User.objects.all().select_related('department').order_by('id')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
