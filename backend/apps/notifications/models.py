"""
Notification Model
==================
In-app notifications for patent status changes and remarks.
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
