"""
Workflow State Machine
======================
Defines which roles are allowed to perform which status transitions.

Transition map:
    DRAFT               → SUBMITTED               (applicant)
    SUBMITTED           → UNDER_SCRUTINY          (scrutinizer, admin)
    SUBMITTED           → REJECTED                (scrutinizer, admin)
    UNDER_SCRUTINY      → FORWARDED_TO_CONSULTANT (scrutinizer, admin)
    UNDER_SCRUTINY      → REJECTED                (scrutinizer, admin)
    FORWARDED_TO_CONSULTANT → APPROVED            (consultant, admin)
    FORWARDED_TO_CONSULTANT → REJECTED            (consultant, admin)
"""

from apps.patents.models import PatentApplicationStatus as S

# { from_status: { to_status: [allowed_roles] } }
TRANSITIONS: dict[str, dict[str, list[str]]] = {
    S.DRAFT: {
        S.SUBMITTED: ['applicant', 'admin'],
    },
    S.SUBMITTED: {
        S.UNDER_SCRUTINY: ['scrutinizer', 'admin'],
        S.REJECTED:       ['scrutinizer', 'admin'],
    },
    S.UNDER_SCRUTINY: {
        S.FORWARDED_TO_CONSULTANT: ['scrutinizer', 'admin'],
        S.REJECTED:                ['scrutinizer', 'admin'],
    },
    S.FORWARDED_TO_CONSULTANT: {
        S.APPROVED: ['consultant', 'admin'],
        S.REJECTED: ['consultant', 'admin'],
    },
}

# Terminal states — no further transitions allowed
TERMINAL_STATES: set[str] = {S.APPROVED, S.REJECTED}


def get_allowed_transitions(current_status: str, role: str) -> list[str]:
    """Return all target statuses this role can transition to from current_status."""
    if current_status in TERMINAL_STATES:
        return []
    targets = TRANSITIONS.get(current_status, {})
    return [to for to, roles in targets.items() if role in roles]


def can_transition(current_status: str, target_status: str, role: str) -> bool:
    """Check if a role can move a patent from current_status to target_status."""
    return target_status in get_allowed_transitions(current_status, role)
