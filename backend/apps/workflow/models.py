"""
Workflow Models
===============
WorkflowEvent logs every status transition on a patent application.
This gives the audit/history trail that the audit app and frontend timeline need.
"""

from django.db import models
from django.conf import settings
from apps.patents.models import PatentApplication, PatentApplicationStatus


class WorkflowEvent(models.Model):
    """Immutable record of a single status transition."""

    application = models.ForeignKey(
        PatentApplication,
        on_delete=models.CASCADE,
        related_name='workflow_events',
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='workflow_actions',
    )
    from_status = models.CharField(
        max_length=30,
        choices=PatentApplicationStatus.choices,
    )
    to_status = models.CharField(
        max_length=30,
        choices=PatentApplicationStatus.choices,
    )
    note = models.TextField(
        blank=True,
        help_text='Optional note explaining the transition',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return (
            f"{self.application.patent_id}: "
            f"{self.from_status} → {self.to_status} "
            f"by {self.performed_by}"
        )
