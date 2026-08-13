from django.db import models
from django.conf import settings
from apps.patents.models import PatentApplication

class DocumentType(models.TextChoices):
    SUPPORTING_DOCUMENTS = 'supporting_documents', 'Supporting Documents'
    PATENT_FORM = 'patent_form', 'Patent Form'
    NDA = 'nda', 'Non-Disclosure Agreement (NDA)'

class Document(models.Model):
    application = models.ForeignKey(
        PatentApplication,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    doc_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file = models.FileField(upload_to='patent_documents/%Y/%m/')
    file_size = models.IntegerField(null=True, blank=True, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.application.patent_id} - {self.get_doc_type_display()}"


class PublicDocumentCategory(models.TextChoices):
    POLICY = 'policy', 'SJEC Patent Policy'
    FORM = 'form', 'Patent Application Form'
    NDA = 'nda', 'Non-Disclosure Agreement (NDA)'
    GUIDELINES = 'guidelines', 'Patent Guidelines'
    PROCESS_FLOW = 'process_flow', 'Patent Process Flow'
    FEE_STRUCTURE = 'fee_structure', 'Patent Fee Structure'
    FAQ = 'faq', 'FAQ'

class PublicDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='public_documents/')
    category = models.CharField(max_length=30, choices=PublicDocumentCategory.choices)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
