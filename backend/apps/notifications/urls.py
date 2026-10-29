from rest_framework.routers import DefaultRouter
from django.urls import path
from apps.notifications.views import NotificationViewSet, NotificationPreferenceView

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
] + router.urls
