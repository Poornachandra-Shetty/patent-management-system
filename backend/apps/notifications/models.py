"""
Notification Models
===================
In-app notifications for patent status changes and remarks,
plus per-user notification preferences.
"""

from django.db import models
from django.conf import settings
from apps.patents.models import PatentApplication


class NotificationEventType(models.TextChoices):
    """Types of events that trigger notifications."""
    STATUS_CHANGE = 'status_change', 'Patent Status Changed'
    REMARK_ADDED = 'remark_added', 'Remark Added'


class Notification(models.Model):
    """
    In-app notification for a user about a patent application event.

    Immutable record of a notification sent to a user.
    """

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="User who receives this notification"
    )

    title = models.CharField(
        max_length=255,
        help_text="Short notification title"
    )

    message = models.TextField(
        help_text="Notification message content"
    )

    event_type = models.CharField(
        max_length=30,
        choices=NotificationEventType.choices,
        help_text="Type of event that triggered the notification"
    )

    related_application = models.ForeignKey(
        PatentApplication,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        help_text="Patent application this notification relates to"
    )

    is_read = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the recipient has read this notification"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the notification was created"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.name}: {self.title}"

    def mark_as_read(self) -> None:
        """Mark this notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])


class NotificationPreference(models.Model):
    """
    Per-user preference controlling which in-app notification events are
    delivered. One row per user, created on first access with all defaults
    enabled (get_or_create pattern).

    Email delivery is not implemented in this portal; email fields are
    reserved for future use and always stored as False.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preference',
        help_text='User this preference belongs to',
    )

    # ── In-app toggles ──────────────────────────────────────────
    status_change_in_app = models.BooleanField(
        default=True,
        help_text='Receive in-app notifications when a patent status changes',
    )
    remark_added_in_app = models.BooleanField(
        default=True,
        help_text='Receive in-app notifications when a remark is added to a patent',
    )

    # ── Email toggles (reserved — email not yet implemented) ────
    status_change_email = models.BooleanField(
        default=False,
        help_text='Email notifications for status changes (not yet implemented)',
    )
    remark_added_email = models.BooleanField(
        default=False,
        help_text='Email notifications for remarks (not yet implemented)',
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self) -> str:
        return f'NotificationPreference for {self.user}'

    @classmethod
    def for_user(cls, user) -> 'NotificationPreference':
        """
        Return (or lazily create) the preference row for the given user.
        Safe to call from notification services.
        """
        pref, _ = cls.objects.get_or_create(user=user)
        return pref
