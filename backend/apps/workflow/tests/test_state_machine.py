from django.test import SimpleTestCase
from apps.patents.models import PatentApplicationStatus as S
from apps.workflow.state_machine import TERMINAL_STATES, can_transition, get_allowed_transitions


class StateMachineTestCase(SimpleTestCase):
    def test_applicant_can_submit_draft(self):
        self.assertTrue(can_transition(S.DRAFT, S.SUBMITTED, 'applicant'))

    def test_applicant_cannot_reject(self):
        self.assertFalse(can_transition(S.SUBMITTED, S.REJECTED, 'applicant'))

    def test_scrutinizer_can_move_submitted_to_scrutiny(self):
        self.assertTrue(can_transition(S.SUBMITTED, S.UNDER_SCRUTINY, 'scrutinizer'))

    def test_consultant_can_approve_forwarded(self):
        self.assertTrue(can_transition(S.FORWARDED_TO_CONSULTANT, S.APPROVED, 'consultant'))

    def test_terminal_states_have_no_transitions(self):
        for terminal in TERMINAL_STATES:
            self.assertEqual(get_allowed_transitions(terminal, 'admin'), [])

    def test_admin_inherits_applicant_submit(self):
        allowed = get_allowed_transitions(S.DRAFT, 'admin')
        self.assertIn(S.SUBMITTED, allowed)

    def test_allowed_transitions_by_role(self):
        cases = [
            (S.SUBMITTED, 'scrutinizer', {S.UNDER_SCRUTINY, S.REJECTED}),
            (S.UNDER_SCRUTINY, 'scrutinizer', {S.FORWARDED_TO_CONSULTANT, S.REJECTED}),
            (S.FORWARDED_TO_CONSULTANT, 'consultant', {S.APPROVED, S.REJECTED}),
        ]
        for current, role, expected in cases:
            with self.subTest(current=current, role=role):
                self.assertEqual(set(get_allowed_transitions(current, role)), expected)
