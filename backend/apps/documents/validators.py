import magic
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'jpg', 'jpeg', 'png']

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

document_extension_validator = FileExtensionValidator(
    allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS
)


def validate_file_size(file):
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB.")


def detect_and_validate_mime_type(file) -> str:
    """
    Reads initial bytes to detect MIME type via python-magic.
    Raises ValidationError if MIME type is not allowed.
    """
    initial_pos = file.tell() if hasattr(file, 'tell') else 0
    file.seek(0)
    sample = file.read(2048)
    file.seek(initial_pos)

    detected_mime = magic.from_buffer(sample, mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"Unsupported or invalid file MIME type: {detected_mime}")
    return detected_mime
