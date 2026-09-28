import mimetypes
try:
    import magic
except ImportError:
    magic = None

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


def _guess_mime_by_signature_or_name(sample: bytes, filename: str) -> str:
    if sample.startswith(b'%PDF'):
        return 'application/pdf'
    if sample.startswith(b'\x89PNG'):
        return 'image/png'
    if sample.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if sample.startswith(b'PK\x03\x04'):
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if sample.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'):
        return 'application/msword'
    return mimetypes.guess_type(filename)[0] or 'application/octet-stream'


def detect_and_validate_mime_type(file) -> str:
    """
    Reads initial bytes to detect MIME type via python-magic or byte signature analysis.
    Falls back to mimetypes guess if magic is unavailable.
    Raises ValidationError if MIME type is not allowed.
    """
    initial_pos = file.tell() if hasattr(file, 'tell') else 0
    file.seek(0)
    sample = file.read(2048)
    file.seek(initial_pos)

    # Reject known malicious/executable magic byte signatures immediately
    if sample.startswith(b'MZ') or sample.startswith(b'\x7fELF'):
        raise ValidationError("Unsupported or invalid file MIME type: application/x-dosexec")

    detected_mime = None
    if magic is not None:
        try:
            detected_mime = magic.from_buffer(sample, mime=True)
        except Exception:
            detected_mime = None

    if not detected_mime:
        detected_mime = _guess_mime_by_signature_or_name(sample, getattr(file, 'name', ''))

    if detected_mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"Unsupported or invalid file MIME type: {detected_mime}")
    return detected_mime

