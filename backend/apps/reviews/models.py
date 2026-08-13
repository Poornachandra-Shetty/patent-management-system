from django.db import models
from django.conf import settings
from apps.patents.models import PatentApplication

class RemarkAction(models.TextChoices):
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    FORWARDED = 'forwarded', 'Forwarded to Consultant'
    COMMENT = 'comment', 'General Comment'

class Remark(models.Model):
    application = models.ForeignKey(
        PatentApplication,
        on_delete=models.CASCADE,
        related_name='remarks'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='remarks'
    )
    text = models.TextField()
    action = models.CharField(max_length=30, choices=RemarkAction.choices, null=True, blank=True)
    visible_to_applicant = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Remark by {self.user.name} on {self.application.patent_id}"
