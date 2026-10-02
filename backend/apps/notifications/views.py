"""
Notification Views
==================
REST API views for user notifications.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer, NotificationDetailSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API viewset for user notifications.

    Endpoints:
    - GET /api/v1/notifications/ - List user's notifications
    - GET /api/v1/notifications/{id}/ - Retrieve specific notification
    - PATCH /api/v1/notifications/{id}/mark-as-read/ - Mark as read
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return NotificationDetailSerializer
        return NotificationSerializer

    def get_queryset(self):
        """Return only notifications for the authenticated user."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('related_application')

    @action(detail=True, methods=['patch'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """
        PATCH /api/v1/notifications/{id}/mark-as-read/

        Mark a notification as read.
        Only the recipient can mark their own notifications as read.
        """
        notification = self.get_object()

        # Verify the user is the recipient
        if notification.recipient != request.user:
            return Response(
                {'detail': 'You can only mark your own notifications as read.'},
                status=status.HTTP_403_FORBIDDEN
            )

        notification.mark_as_read()

        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        """
        PATCH /api/v1/notifications/mark-all-as-read/

        Mark all unread notifications as read for the authenticated user.
        """
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({
            'detail': f'{unread_count} notifications marked as read.'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """
        GET /api/v1/notifications/unread-count/

        Get the count of unread notifications for the authenticated user.
        """
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
