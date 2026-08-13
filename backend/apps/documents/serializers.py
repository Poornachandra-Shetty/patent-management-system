from rest_framework import serializers
from apps.documents.models import Document, PublicDocument

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'application', 'uploaded_by', 'uploaded_by_name', 'doc_type', 'file', 'file_size', 'mime_type', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class PublicDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicDocument
        fields = ['id', 'title', 'file', 'category', 'uploaded_at', 'updated_at']
