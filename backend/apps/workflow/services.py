"""
Canonical service layer for patent status transitions.

All status changes — including POST /patents/{id}/submit/ — must go through
transition_patent() so role checks, object permissions, and WorkflowEvent
logging stay consistent.
"""

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.patents.models import PatentApplication, PatentApplicationStatus as S
from apps.workflow.exceptions import (
    ConsultantRequiredError,
    InvalidConsultantError,
    PatentAccessDeniedError,
    TerminalStateError,
    TransitionNotAllowedError,
)
from apps.workflow.models import WorkflowEvent
from apps.workflow.permissions import can_act_on_patent
from apps.workflow.state_machine import TERMINAL_STATES, can_transition, get_allowed_transitions

User = get_user_model()


@transaction.atomic
def transition_patent(
    *,
    patent: PatentApplication,
    to_status: str,
    performed_by: User,
    note: str = '',
    consultant_id: int | None = None,
) -> WorkflowEvent:
    """
    Atomically transition a patent to a new status and record a WorkflowEvent.

    Raises:
        TerminalStateError: Patent is already approved or rejected.
        PatentAccessDeniedError: User cannot act on this patent.
        TransitionNotAllowedError: Transition invalid for role or current status.
        ConsultantRequiredError: Forwarding without consultant_id.
        InvalidConsultantError: consultant_id is not an active consultant.
    """
    locked_patent = (
        PatentApplication.objects.select_for_update().select_related('applicant', 'assigned_to').get(pk=patent.pk)
    )
    role: str = performed_by.role  # type: ignore[union-attr]

    if locked_patent.status in TERMINAL_STATES:
        raise TerminalStateError(
            f'Patent is already in a terminal state: {locked_patent.status}.'
        )

    if not can_act_on_patent(performed_by, locked_patent):
        raise PatentAccessDeniedError(
            'You do not have permission to transition this patent application.'
        )

    if not can_transition(locked_patent.status, to_status, role):
        allowed = get_allowed_transitions(locked_patent.status, role)
        if allowed:
            raise TransitionNotAllowedError(
                (
                    f"Transition to '{to_status}' is not allowed from "
                    f"'{locked_patent.status}' for role '{role}'. "
                    f"Allowed transitions: {allowed}"
                ),
                allowed=allowed,
            )
        raise TransitionNotAllowedError(
            f"Role '{role}' has no allowed transitions from '{locked_patent.status}'.",
            allowed=[],
        )

    update_fields = ['status', 'updated_at']

    if to_status == S.FORWARDED_TO_CONSULTANT:
        if consultant_id is None:
            raise ConsultantRequiredError(
                'consultant_id is required when forwarding to a consultant.'
            )
        try:
            consultant = User.objects.get(pk=consultant_id, role='consultant', is_active=True)
        except User.DoesNotExist as exc:
            raise InvalidConsultantError(
                f'No active consultant found with id {consultant_id}.'
            ) from exc
        locked_patent.assigned_to = consultant
        update_fields.append('assigned_to')

    from_status = locked_patent.status
    locked_patent.status = to_status
    locked_patent.save(update_fields=update_fields)

    return WorkflowEvent.objects.create(
        application=locked_patent,
        performed_by=performed_by,
        from_status=from_status,
        to_status=to_status,
        note=note,
    )
