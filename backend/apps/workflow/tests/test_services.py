import pytest

from apps.patents.models import PatentApplicationStatus
from apps.workflow.exceptions import (
    ConsultantRequiredError,
    PatentAccessDeniedError,
    TerminalStateError,
)
from apps.workflow.models import WorkflowEvent
from apps.workflow.services import transition_patent


@pytest.mark.django_db
class TestTransitionService:
    def test_applicant_submits_own_draft(self, draft_patent, applicant):
        event = transition_patent(
            patent=draft_patent,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=applicant,
        )

        draft_patent.refresh_from_db()
        assert draft_patent.status == PatentApplicationStatus.SUBMITTED
        assert event.from_status == PatentApplicationStatus.DRAFT
        assert event.to_status == PatentApplicationStatus.SUBMITTED
        assert WorkflowEvent.objects.count() == 1

    def test_applicant_cannot_submit_someone_elses_patent(
        self, draft_patent, other_applicant
    ):
        with pytest.raises(PatentAccessDeniedError):
            transition_patent(
                patent=draft_patent,
                to_status=PatentApplicationStatus.SUBMITTED,
                performed_by=other_applicant,
            )

    def test_scrutinizer_moves_to_under_scrutiny(self, submitted_patent, scrutinizer):
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=scrutinizer,
        )
        submitted_patent.refresh_from_db()
        assert submitted_patent.status == PatentApplicationStatus.UNDER_SCRUTINY

    def test_forward_requires_consultant(self, submitted_patent, scrutinizer):
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=scrutinizer,
        )

        with pytest.raises(ConsultantRequiredError):
            transition_patent(
                patent=submitted_patent,
                to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
                performed_by=scrutinizer,
            )

    def test_forward_assigns_consultant(
        self, submitted_patent, scrutinizer, consultant
    ):
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=scrutinizer,
        )
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
            performed_by=scrutinizer,
            consultant_id=consultant.pk,
        )

        submitted_patent.refresh_from_db()
        assert submitted_patent.status == PatentApplicationStatus.FORWARDED_TO_CONSULTANT
        assert submitted_patent.assigned_to_id == consultant.pk

    def test_terminal_state_rejected(self, submitted_patent, scrutinizer):
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.REJECTED,
            performed_by=scrutinizer,
        )

        with pytest.raises(TerminalStateError):
            transition_patent(
                patent=submitted_patent,
                to_status=PatentApplicationStatus.UNDER_SCRUTINY,
                performed_by=scrutinizer,
            )

    def test_consultant_cannot_act_on_unassigned_patent(
        self, submitted_patent, scrutinizer, consultant
    ):
        transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=scrutinizer,
        )

        # Simulate forwarded status without assignment (data inconsistency guard).
        submitted_patent.status = PatentApplicationStatus.FORWARDED_TO_CONSULTANT
        submitted_patent.assigned_to = None
        submitted_patent.save(update_fields=['status', 'assigned_to'])

        with pytest.raises(PatentAccessDeniedError):
            transition_patent(
                patent=submitted_patent,
                to_status=PatentApplicationStatus.APPROVED,
                performed_by=consultant,
            )

        submitted_patent.assigned_to = consultant
        submitted_patent.save(update_fields=['assigned_to'])

        event = transition_patent(
            patent=submitted_patent,
            to_status=PatentApplicationStatus.APPROVED,
            performed_by=consultant,
        )
        assert event.to_status == PatentApplicationStatus.APPROVED
