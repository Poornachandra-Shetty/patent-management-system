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
            # Revised workflow sequence cases
            (S.SUBMITTED, 'consultant', {S.UNDER_CONSULTANT_REVIEW, S.UNDER_REVIEW_TEAM, S.REJECTED}),
            (S.UNDER_CONSULTANT_REVIEW, 'consultant', {S.UNDER_REVIEW_TEAM, S.REJECTED}),
            (S.UNDER_REVIEW_TEAM, 'review_team', {S.PENDING_FINAL_APPROVAL, S.REJECTED}),
            (S.PENDING_FINAL_APPROVAL, 'consultant', {S.APPROVED, S.REJECTED}),
        ]
        for current, role, expected in cases:
            with self.subTest(current=current, role=role):
                self.assertEqual(set(get_allowed_transitions(current, role)), expected)

    def test_revised_consultant_review_team_pipeline(self):
        # 1. Consultant receives submitted patent and evaluates
        self.assertTrue(can_transition(S.SUBMITTED, S.UNDER_CONSULTANT_REVIEW, 'consultant'))
        # 2. Consultant forwards to Review Team
        self.assertTrue(can_transition(S.UNDER_CONSULTANT_REVIEW, S.UNDER_REVIEW_TEAM, 'consultant'))
        # 3. Review Team forwards meeting report back to Consultant
        self.assertTrue(can_transition(S.UNDER_REVIEW_TEAM, S.PENDING_FINAL_APPROVAL, 'review_team'))
        # 4. Consultant gives final approval
        self.assertTrue(can_transition(S.PENDING_FINAL_APPROVAL, S.APPROVED, 'consultant'))
        # 5. Applicant cannot perform internal committee transitions
        self.assertFalse(can_transition(S.UNDER_REVIEW_TEAM, S.PENDING_FINAL_APPROVAL, 'applicant'))
        self.assertFalse(can_transition(S.PENDING_FINAL_APPROVAL, S.APPROVED, 'applicant'))
