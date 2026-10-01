from rest_framework import serializers
from apps.documents.models import Document, PublicDocument
from apps.documents.validators import (
    document_extension_validator,
    validate_file_size,
    detect_and_validate_mime_type,
)


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'application', 'uploaded_by', 'uploaded_by_name',
            'doc_type', 'file', 'file_size', 'mime_type', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'file_size', 'mime_type', 'uploaded_at']

    def validate_file(self, value):
        # 1. Extension check
        document_extension_validator(value)
        # 2. Size check
        validate_file_size(value)
        # 3. MIME detection via python-magic
        detect_and_validate_mime_type(value)
        return value


class PublicDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicDocument
        fields = ['id', 'title', 'file', 'category', 'uploaded_at', 'updated_at']

    def validate_file(self, value):
        document_extension_validator(value)
        validate_file_size(value)
        detect_and_validate_mime_type(value)
        return value
