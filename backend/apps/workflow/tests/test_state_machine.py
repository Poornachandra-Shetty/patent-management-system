import pytest

from apps.patents.models import PatentApplicationStatus as S
from apps.workflow.state_machine import TERMINAL_STATES, can_transition, get_allowed_transitions


class TestStateMachine:
    def test_applicant_can_submit_draft(self):
        assert can_transition(S.DRAFT, S.SUBMITTED, 'applicant') is True

    def test_applicant_cannot_reject(self):
        assert can_transition(S.SUBMITTED, S.REJECTED, 'applicant') is False

    def test_scrutinizer_can_move_submitted_to_scrutiny(self):
        assert can_transition(S.SUBMITTED, S.UNDER_SCRUTINY, 'scrutinizer') is True

    def test_consultant_can_approve_forwarded(self):
        assert can_transition(S.FORWARDED_TO_CONSULTANT, S.APPROVED, 'consultant') is True

    def test_terminal_states_have_no_transitions(self):
        for terminal in TERMINAL_STATES:
            assert get_allowed_transitions(terminal, 'admin') == []

    def test_admin_inherits_applicant_submit(self):
        allowed = get_allowed_transitions(S.DRAFT, 'admin')
        assert S.SUBMITTED in allowed

    @pytest.mark.parametrize(
        ('current', 'role', 'expected'),
        [
            (S.SUBMITTED, 'scrutinizer', {S.UNDER_SCRUTINY, S.REJECTED}),
            (S.UNDER_SCRUTINY, 'scrutinizer', {S.FORWARDED_TO_CONSULTANT, S.REJECTED}),
            (S.FORWARDED_TO_CONSULTANT, 'consultant', {S.APPROVED, S.REJECTED}),
        ],
    )
    def test_allowed_transitions_by_role(self, current, role, expected):
        assert set(get_allowed_transitions(current, role)) == expected
