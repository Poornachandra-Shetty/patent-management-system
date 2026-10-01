"""
Audit Trail Selectors
=====================
Query functions for retrieving combined audit trail data.
"""

from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.workflow.models import WorkflowEvent
from apps.reviews.models import Remark
from apps.workflow.permissions import can_view_patent

User = get_user_model()


def get_audit_trail(
    patent: PatentApplication,
    user: User,
    limit: int | None = None,
    offset: int = 0,
    max_entries: int = 500,
) -> list[dict[str, Any]]:
    """
    Retrieve combined audit trail for a patent application with DB-level bounded queries.

    Returns a chronologically ordered list of audit entries (status changes + remarks).
    Only returns data the user is authorized to view.

    Args:
        patent: PatentApplication instance
        user: User requesting the audit trail
        limit: Optional page size for DB-level bounded querying
        offset: Optional offset for pagination
        max_entries: Maximum number of events/remarks to query from DB (default 500)

    Returns:
        List of audit entry dictionaries, ordered by timestamp (descending)

    Raises:
        None - returns empty list if user is not authorized
    """
    # Permission check: user must be able to view this patent
    if not can_view_patent(user, patent):
        return []

    fetch_limit = min(offset + limit, max_entries) if limit is not None else max_entries
    audit_entries: list[dict[str, Any]] = []

    # Fetch WorkflowEvent entries (status changes) with DB limit
    workflow_events = (
        WorkflowEvent.objects
        .filter(application=patent)
        .select_related('performed_by', 'application')
        .order_by('-created_at')[:fetch_limit]
    )

    for event in workflow_events:
        audit_entries.append({
            'entry_id': event.id,
            'entry_type': 'status_change',
            'timestamp': event.created_at,
            'actor': {
                'id': event.performed_by.id if event.performed_by else None,
                'name': event.performed_by.name if event.performed_by else 'Unknown',
                'email': event.performed_by.email if event.performed_by else 'Unknown',
            },
            'actor_role': event.performed_by.role if event.performed_by else 'Unknown',
            'from_status': event.from_status,
            'to_status': event.to_status,
            'transition_note': event.note,
            'remark_text': None,
            'remark_action': None,
            'visible_to_applicant': True,  # Status changes are always visible
        })

    # Fetch Remark entries with DB limit
    remarks_qs = (
        Remark.objects
        .filter(application=patent)
        .select_related('user', 'application')
        .order_by('-created_at')
    )

    if user.role == 'applicant':
        # Applicants only see remarks marked as visible_to_applicant
        remarks_qs = remarks_qs.filter(visible_to_applicant=True)

    for remark in remarks_qs[:fetch_limit]:
        audit_entries.append({
            'entry_id': remark.id,
            'entry_type': 'remark',
            'timestamp': remark.created_at,
            'actor': {
                'id': remark.user.id,
                'name': remark.user.name,
                'email': remark.user.email,
            },
            'actor_role': remark.user.role,
            'from_status': None,
            'to_status': None,
            'transition_note': None,
            'remark_text': remark.text,
            'remark_action': remark.action,
            'visible_to_applicant': remark.visible_to_applicant,
        })

    # Sort combined entries by timestamp, most recent first
    audit_entries.sort(key=lambda x: x['timestamp'], reverse=True)

    if limit is not None:
        return audit_entries[offset:offset + limit]

    return audit_entries[:max_entries]


def get_audit_trail_count(patent: PatentApplication, user: User) -> int:
    """
    Get the total count of auditable entries for a patent application.
    Uses efficient DB COUNT queries.
    """
    if not can_view_patent(user, patent):
        return 0

    events_count = WorkflowEvent.objects.filter(application=patent).count()

    remarks_qs = Remark.objects.filter(application=patent)
    if user.role == 'applicant':
        remarks_qs = remarks_qs.filter(visible_to_applicant=True)
    remarks_count = remarks_qs.count()

    return events_count + remarks_count


def get_patent_audits_for_user(user: User, limit: int = 50) -> QuerySet:
    """
    Get all patents where the user can view audit trails.

    Returns a queryset of PatentApplication objects the user has audit access to.
    Uses select_related('applicant') to avoid N+1 queries.

    Args:
        user: The user requesting audit information
        limit: Maximum number of patents to return (for pagination)

    Returns:
        QuerySet of PatentApplication objects
    """
    role: str = user.role  # type: ignore[union-attr]

    base_qs = PatentApplication.objects.select_related('applicant').order_by('-created_at')

    if role == 'admin':
        # Admins can see audit trails for all patents
        return base_qs.all()[:limit]

    elif role == 'applicant':
        # Applicants can see audit trails for their own patents
        return base_qs.filter(applicant=user)[:limit]

    elif role == 'consultant':
        # Consultants can see audit trails for patents assigned to them
        return base_qs.filter(assigned_to=user)[:limit]

    elif role == 'scrutinizer':
        # Scrutinizers can see audit trails for submitted and in-progress patents
        return base_qs.exclude(status=PatentApplicationStatus.DRAFT)[:limit]

    # Unknown role: no audit access
    return PatentApplication.objects.none()
