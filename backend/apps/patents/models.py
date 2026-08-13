from django.db import models
from django.conf import settings
from apps.departments.models import Department

class PatentApplicationStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    UNDER_SCRUTINY = 'under_scrutiny', 'Under Scrutiny'
    FORWARDED_TO_CONSULTANT = 'forwarded_to_consultant', 'Forwarded to Consultant'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'

class PatentApplication(models.Model):
    patent_id = models.CharField(max_length=50, unique=True, db_index=True)
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patent_applications'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_applications',
        help_text="Consultant assigned to review"
    )
    title = models.CharField(max_length=255)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='patent_applications'
    )
    category = models.CharField(max_length=100, help_text="Category of Patent")
    abstract = models.TextField()
    keywords = models.CharField(max_length=255, help_text="Comma-separated keywords")
    problem_statement = models.TextField()
    novelty_description = models.TextField()
    proposed_application = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=PatentApplicationStatus.choices,
        default=PatentApplicationStatus.DRAFT,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patent_id} - {self.title}"


class Inventor(models.Model):
    application = models.ForeignKey(
        PatentApplication,
        on_delete=models.CASCADE,
        related_name='inventors'
    )
    name = models.CharField(max_length=150)
    usn_or_emp_id = models.CharField(max_length=50)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    is_primary_inventor = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.usn_or_emp_id})"
