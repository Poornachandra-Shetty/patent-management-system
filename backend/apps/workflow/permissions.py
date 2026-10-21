"""
Object-level access control for workflow operations.

Role-based transition rules live in state_machine.py; this module ensures users
can only act on patents they are allowed to see in their queue.
"""

from django.contrib.auth.models import AbstractBaseUser

from apps.patents.models import PatentApplication, PatentApplicationStatus as S


def can_view_patent(user: AbstractBaseUser, patent: PatentApplication) -> bool:
    """Return True if the user may view this patent's workflow history."""
    role: str = getattr(user, 'role', '')

    if role == 'admin' or getattr(user, 'is_staff', False):
        return True
    if role == 'applicant':
        return patent.applicant_id == user.pk
    if role == 'consultant':
        return patent.status != S.DRAFT or patent.assigned_to_id == user.pk
    if role in ('scrutinizer', 'review_team'):
        return patent.status != S.DRAFT
    return False


def can_act_on_patent(user: AbstractBaseUser, patent: PatentApplication) -> bool:
    """Return True if the user may perform a workflow transition on this patent."""
    role: str = getattr(user, 'role', '')

    if role == 'admin' or getattr(user, 'is_staff', False):
        return True
    if role == 'applicant':
        return patent.applicant_id == user.pk
    if role in ('scrutinizer', 'review_team'):
        return patent.status in (S.SUBMITTED, S.UNDER_REVIEW_TEAM, S.UNDER_SCRUTINY)
    if role == 'consultant':
        # Any active consultant can pick up unassigned submissions for evaluation
        if patent.status in (S.SUBMITTED, S.UNDER_CONSULTANT_REVIEW):
            return patent.assigned_to_id is None or patent.assigned_to_id == user.pk
        # Final approval and forwarded evaluations require being the assigned consultant
        if patent.status in (S.PENDING_FINAL_APPROVAL, S.FORWARDED_TO_CONSULTANT):
            return patent.assigned_to_id == user.pk
        return False
    return False
