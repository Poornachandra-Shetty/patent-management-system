from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.authentication.views import RegisterView, UserProfileView, EmailTokenObtainPairView

urlpatterns = [
    path('login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', UserProfileView.as_view(), name='auth_profile'),
]
