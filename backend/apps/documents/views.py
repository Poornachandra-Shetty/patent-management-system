import mimetypes
import os
from django.http import FileResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from apps.documents.models import Document, PublicDocument
from apps.documents.serializers import DocumentSerializer, PublicDocumentSerializer
from apps.documents.permissions import CanAccessDocument
from apps.patents.models import PatentApplication, PatentApplicationStatus


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessDocument]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')

        if role == 'admin' or user.is_staff or user.is_superuser:
            return Document.objects.all().select_related('application', 'uploaded_by')

        if role == 'applicant':
            return Document.objects.filter(
                application__applicant=user
            ).select_related('application', 'uploaded_by')

        if role == 'consultant':
            return Document.objects.filter(
                application__assigned_to=user
            ).select_related('application', 'uploaded_by')

        if role == 'scrutinizer':
            return Document.objects.exclude(
                application__status=PatentApplicationStatus.DRAFT
            ).select_related('application', 'uploaded_by')

        return Document.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', '')
        application = serializer.validated_data.get('application')

        # Verify applicant only attaches to their own applications in allowed states
        if role == 'applicant':
            if application.applicant_id != user.pk:
                raise PermissionDenied("You can only upload documents to your own patent applications.")
            if application.status not in (PatentApplicationStatus.DRAFT, 'scrutiny_rejected', PatentApplicationStatus.SUBMITTED):
                raise PermissionDenied("Cannot attach documents while application is under formal evaluation.")

        uploaded_file = self.request.FILES.get('file')
        file_size = uploaded_file.size if uploaded_file else None
        mime_type = ''
        if uploaded_file:
            mime_type = getattr(uploaded_file, 'content_type', '') or mimetypes.guess_type(uploaded_file.name)[0] or ''

        serializer.save(
            uploaded_by=user,
            file_size=file_size,
            mime_type=mime_type,
        )

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        Secure streaming endpoint for patent documents with object-level permission enforcement.
        """
        document = self.get_object()
        if not document.file:
            raise Http404("File not found on storage.")

        try:
            file_handle = document.file.open('rb')
        except (FileNotFoundError, OSError):
            raise Http404("Document file missing from storage backend.")

        filename = os.path.basename(document.file.name)
        content_type = document.mime_type or mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class PublicDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PublicDocument.objects.all().order_by('-uploaded_at')
    serializer_class = PublicDocumentSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        Public document streaming endpoint.
        """
        doc = self.get_object()
        if not doc.file:
            raise Http404("File not found.")

        try:
            file_handle = doc.file.open('rb')
        except (FileNotFoundError, OSError):
            raise Http404("Document file missing from storage.")

        filename = os.path.basename(doc.file.name)
        content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
