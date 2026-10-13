"""
Notification Serializers
========================
Serializers for Notification model and NotificationPreference model.
"""

from rest_framework import serializers
from apps.notifications.models import Notification, NotificationPreference
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


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationPreference.

    GET  returns current preferences (or defaults if row doesn't exist yet).
    PATCH accepts any subset of the writable boolean fields.

    Email fields are read-only here because email delivery is not implemented;
    they are exposed as False so the frontend can render an honest state.
    """

    class Meta:
        model = NotificationPreference
        fields = [
            'status_change_in_app',
            'remark_added_in_app',
            'status_change_email',
            'remark_added_email',
            'updated_at',
        ]
        read_only_fields = [
            'status_change_email',
            'remark_added_email',
            'updated_at',
        ]
