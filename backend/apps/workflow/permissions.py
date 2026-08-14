"""
Object-level access control for workflow operations.

Role-based transition rules live in state_machine.py; this module ensures users
can only act on patents they are allowed to see in their queue.
"""

from django.contrib.auth.models import AbstractBaseUser

from apps.patents.models import PatentApplication, PatentApplicationStatus as S


def can_view_patent(user: AbstractBaseUser, patent: PatentApplication) -> bool:
    """Return True if the user may view this patent's workflow history."""
    role: str = user.role  # type: ignore[union-attr]

    if role == 'admin':
        return True
    if role == 'applicant':
        return patent.applicant_id == user.pk
    if role == 'consultant':
        return patent.assigned_to_id == user.pk
    if role == 'scrutinizer':
        return patent.status != S.DRAFT
    return False


def can_act_on_patent(user: AbstractBaseUser, patent: PatentApplication) -> bool:
    """Return True if the user may perform a workflow transition on this patent."""
    role: str = user.role  # type: ignore[union-attr]

    if role == 'admin':
        return True
    if role == 'applicant':
        return patent.applicant_id == user.pk
    if role == 'scrutinizer':
        return patent.status in (S.SUBMITTED, S.UNDER_SCRUTINY)
    if role == 'consultant':
        return patent.assigned_to_id == user.pk
    return False
