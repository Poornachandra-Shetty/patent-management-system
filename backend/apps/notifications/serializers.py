"""
Notification Serializers
========================
Serializers for Notification model.
"""

from rest_framework import serializers
from apps.notifications.models import Notification
from apps.patents.serializers import PatentApplicationListSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""

    related_application_detail = PatentApplicationListSerializer(
        source='related_application',
        read_only=True,
        required=False
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'event_type',
            'related_application', 'related_application_detail',
            'is_read', 'created_at'
        ]
        read_only_fields = [
            'id', 'title', 'message', 'event_type',
            'related_application', 'related_application_detail',
            'created_at'
        ]


class NotificationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Notification with full patent info."""

    related_application_detail = PatentApplicationListSerializer(
        source='related_application',
        read_only=True,
        required=False
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'event_type',
            'related_application', 'related_application_detail',
            'is_read', 'created_at'
        ]
        read_only_fields = [
            'id', 'title', 'message', 'event_type',
            'related_application', 'related_application_detail',
            'created_at'
        ]
