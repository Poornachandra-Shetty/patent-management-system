from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.authentication.serializers import (
    AdminUserSerializer,
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    SJECTokenObtainPairSerializer,
    UserSerializer,
)
from apps.common.permissions import IsAdminRole

User = get_user_model()


class SJECTokenObtainPairView(TokenObtainPairView):
    serializer_class = SJECTokenObtainPairSerializer


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


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/

    Change the authenticated user's password.

    Request body:
        current_password  : string  (required) — must match the stored password
        new_password      : string  (required) — validated against Django AUTH_PASSWORD_VALIDATORS
        confirm_password  : string  (required) — must equal new_password

    Responses:
        200  { "detail": "Password changed successfully." }
        400  { "current_password": [...] | "new_password": [...] | "confirm_password": [...] | "non_field_errors": [...] }
        401  Not authenticated
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password  = request.data.get('current_password', '')
        new_password      = request.data.get('new_password', '')
        confirm_password  = request.data.get('confirm_password', '')

        errors = {}

        # 1. Validate current password
        if not current_password:
            errors['current_password'] = ['This field is required.']
        elif not user.check_password(current_password):
            errors['current_password'] = ['Current password is incorrect.']

        # 2. Validate new password presence
        if not new_password:
            errors['new_password'] = ['This field is required.']

        # 3. Validate confirm matches new
        if not confirm_password:
            errors['confirm_password'] = ['This field is required.']
        elif new_password and new_password != confirm_password:
            errors['confirm_password'] = ['Passwords do not match.']

        # 4. Prevent reuse of current password
        if new_password and not errors.get('current_password') and user.check_password(new_password):
            errors['new_password'] = ['New password must be different from the current password.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # 5. Run Django AUTH_PASSWORD_VALIDATORS
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        # 6. Set and save new password
        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
