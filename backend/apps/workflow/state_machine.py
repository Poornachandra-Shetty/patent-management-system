"""
Workflow State Machine
======================
Defines which roles are allowed to perform which status transitions.

Revised Transition map:
    DRAFT                   → SUBMITTED               (applicant, admin)
    SUBMITTED               → UNDER_CONSULTANT_REVIEW (consultant, admin)
    SUBMITTED               → UNDER_REVIEW_TEAM       (consultant, admin)
    SUBMITTED               → REJECTED                (consultant, admin)
    UNDER_CONSULTANT_REVIEW → UNDER_REVIEW_TEAM       (consultant, admin)
    UNDER_CONSULTANT_REVIEW → REJECTED                (consultant, admin)
    UNDER_REVIEW_TEAM       → PENDING_FINAL_APPROVAL  (review_team, scrutinizer, admin)
    UNDER_REVIEW_TEAM       → REJECTED                (review_team, scrutinizer, admin)
    PENDING_FINAL_APPROVAL  → APPROVED                (consultant, admin)
    PENDING_FINAL_APPROVAL  → REJECTED                (consultant, admin)

Legacy transitions preserved for backwards compatibility:
    SUBMITTED               → UNDER_SCRUTINY          (scrutinizer, review_team, admin)
    UNDER_SCRUTINY          → FORWARDED_TO_CONSULTANT (scrutinizer, review_team, admin)
    UNDER_SCRUTINY          → REJECTED                (scrutinizer, review_team, admin)
    FORWARDED_TO_CONSULTANT → APPROVED                (consultant, admin)
    FORWARDED_TO_CONSULTANT → REJECTED                (consultant, admin)
"""

from apps.patents.models import PatentApplicationStatus as S

# { from_status: { to_status: [allowed_roles] } }
TRANSITIONS: dict[str, dict[str, list[str]]] = {
    S.DRAFT: {
        S.SUBMITTED: ['applicant', 'admin'],
    },
    S.SUBMITTED: {
        S.UNDER_CONSULTANT_REVIEW: ['consultant', 'admin'],
        S.UNDER_REVIEW_TEAM:       ['consultant', 'admin'],
        S.REJECTED:                ['consultant', 'admin', 'scrutinizer', 'review_team'],
        # Legacy support
        S.UNDER_SCRUTINY:          ['scrutinizer', 'review_team', 'admin'],
    },
    S.UNDER_CONSULTANT_REVIEW: {
        S.UNDER_REVIEW_TEAM:       ['consultant', 'admin'],
        S.REJECTED:                ['consultant', 'admin'],
    },
    S.UNDER_REVIEW_TEAM: {
        S.PENDING_FINAL_APPROVAL:  ['scrutinizer', 'review_team', 'admin'],
        S.REJECTED:                ['scrutinizer', 'review_team', 'admin'],
    },
    S.PENDING_FINAL_APPROVAL: {
        S.APPROVED:                ['consultant', 'admin'],
        S.REJECTED:                ['consultant', 'admin'],
    },
    # Legacy flow support
    S.UNDER_SCRUTINY: {
        S.FORWARDED_TO_CONSULTANT: ['scrutinizer', 'review_team', 'admin'],
        S.REJECTED:                ['scrutinizer', 'review_team', 'admin'],
    },
    S.FORWARDED_TO_CONSULTANT: {
        S.APPROVED:                ['consultant', 'admin'],
        S.REJECTED:                ['consultant', 'admin'],
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
