"""Domain exceptions for patent workflow transitions."""

from rest_framework import status as http_status


class WorkflowError(Exception):
    """Base class for workflow transition errors."""


class TerminalStateError(WorkflowError):
    """Raised when a patent is already in a terminal state."""


class TransitionNotAllowedError(WorkflowError):
    """Raised when the requested transition is invalid for the role or current status."""

    def __init__(self, message: str, allowed: list[str] | None = None) -> None:
        super().__init__(message)
        self.allowed = allowed or []


class PatentAccessDeniedError(WorkflowError):
    """Raised when the user cannot act on or view the patent application."""


class ConsultantRequiredError(WorkflowError):
    """Raised when forwarding to consultant without specifying consultant_id."""


class InvalidConsultantError(WorkflowError):
    """Raised when consultant_id does not refer to an active consultant user."""


def http_status_for(exc: WorkflowError) -> int:
    """Map a workflow exception to an HTTP status code."""
    if isinstance(exc, TerminalStateError):
        return http_status.HTTP_400_BAD_REQUEST
    if isinstance(exc, TransitionNotAllowedError):
        return http_status.HTTP_403_FORBIDDEN
    if isinstance(exc, (PatentAccessDeniedError, InvalidConsultantError)):
        return http_status.HTTP_403_FORBIDDEN
    if isinstance(exc, ConsultantRequiredError):
        return http_status.HTTP_400_BAD_REQUEST
    return http_status.HTTP_400_BAD_REQUEST
