from rest_framework import viewsets, permissions
from apps.documents.models import Document, PublicDocument
from apps.documents.serializers import DocumentSerializer, PublicDocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class PublicDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PublicDocument.objects.all()
    serializer_class = PublicDocumentSerializer
    permission_classes = [permissions.AllowAny]
