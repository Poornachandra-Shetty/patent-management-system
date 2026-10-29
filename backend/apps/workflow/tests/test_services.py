from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.departments.models import Department
from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.workflow.exceptions import (
    ConsultantRequiredError,
    PatentAccessDeniedError,
    TerminalStateError,
)
from apps.workflow.models import WorkflowEvent
from apps.workflow.services import transition_patent

User = get_user_model()


class TransitionServiceTestCase(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Computer Science & Engineering', code='CSE')
        self.applicant = User.objects.create_user(
            email='applicant@test.edu',
            password='pass1234',
            name='Test Applicant',
            usn_or_emp_id='USN9001',
            mobile='9000000001',
            role='applicant',
            department=self.department,
        )
        self.other_applicant = User.objects.create_user(
            email='other@test.edu',
            password='pass1234',
            name='Other Applicant',
            usn_or_emp_id='USN9002',
            mobile='9000000002',
            role='applicant',
            department=self.department,
        )
        self.scrutinizer = User.objects.create_user(
            email='scrutinizer@test.edu',
            password='pass1234',
            name='Test Scrutinizer',
            usn_or_emp_id='EMP9001',
            mobile='9000000003',
            role='scrutinizer',
            department=self.department,
        )
        self.consultant = User.objects.create_user(
            email='consultant@test.edu',
            password='pass1234',
            name='Test Consultant',
            usn_or_emp_id='EMP9002',
            mobile='9000000004',
            role='consultant',
            department=self.department,
        )
        self.draft_patent = PatentApplication.objects.create(
            patent_id='PAT-2026-CSE-900',
            applicant=self.applicant,
            department=self.department,
            title='Test Patent',
            category='Software',
            abstract='Abstract',
            keywords='test',
            problem_statement='Problem',
            novelty_description='Novelty',
            proposed_application='Application',
            status=PatentApplicationStatus.DRAFT,
        )
        self.submitted_patent = PatentApplication.objects.create(
            patent_id='PAT-2026-CSE-901',
            applicant=self.applicant,
            department=self.department,
            title='Submitted Patent',
            category='Software',
            abstract='Abstract',
            keywords='test',
            problem_statement='Problem',
            novelty_description='Novelty',
            proposed_application='Application',
            status=PatentApplicationStatus.SUBMITTED,
        )

    def test_applicant_submits_own_draft(self):
        event = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=self.applicant,
        )

        self.draft_patent.refresh_from_db()
        self.assertEqual(self.draft_patent.status, PatentApplicationStatus.SUBMITTED)
        self.assertEqual(event.from_status, PatentApplicationStatus.DRAFT)
        self.assertEqual(event.to_status, PatentApplicationStatus.SUBMITTED)
        self.assertEqual(WorkflowEvent.objects.count(), 1)

    def test_applicant_cannot_submit_someone_elses_patent(self):
        with self.assertRaises(PatentAccessDeniedError):
            transition_patent(
                patent=self.draft_patent,
                to_status=PatentApplicationStatus.SUBMITTED,
                performed_by=self.other_applicant,
            )

    def test_scrutinizer_moves_to_under_scrutiny(self):
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=self.scrutinizer,
        )
        self.submitted_patent.refresh_from_db()
        self.assertEqual(self.submitted_patent.status, PatentApplicationStatus.UNDER_SCRUTINY)

    def test_forward_requires_consultant(self):
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=self.scrutinizer,
        )

        with self.assertRaises(ConsultantRequiredError):
            transition_patent(
                patent=self.submitted_patent,
                to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
                performed_by=self.scrutinizer,
            )

    def test_forward_assigns_consultant(self):
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=self.scrutinizer,
        )
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
            performed_by=self.scrutinizer,
            consultant_id=self.consultant.pk,
        )

        self.submitted_patent.refresh_from_db()
        self.assertEqual(self.submitted_patent.status, PatentApplicationStatus.FORWARDED_TO_CONSULTANT)
        self.assertEqual(self.submitted_patent.assigned_to_id, self.consultant.pk)

    def test_terminal_state_rejected(self):
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.REJECTED,
            performed_by=self.scrutinizer,
        )

        with self.assertRaises(TerminalStateError):
            transition_patent(
                patent=self.submitted_patent,
                to_status=PatentApplicationStatus.UNDER_SCRUTINY,
                performed_by=self.scrutinizer,
            )

    def test_consultant_cannot_act_on_unassigned_patent(self):
        transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.UNDER_SCRUTINY,
            performed_by=self.scrutinizer,
        )

        self.submitted_patent.status = PatentApplicationStatus.FORWARDED_TO_CONSULTANT
        self.submitted_patent.assigned_to = None
        self.submitted_patent.save(update_fields=['status', 'assigned_to'])

        with self.assertRaises(PatentAccessDeniedError):
            transition_patent(
                patent=self.submitted_patent,
                to_status=PatentApplicationStatus.APPROVED,
                performed_by=self.consultant,
            )

        self.submitted_patent.assigned_to = self.consultant
        self.submitted_patent.save(update_fields=['assigned_to'])

        event = transition_patent(
            patent=self.submitted_patent,
            to_status=PatentApplicationStatus.APPROVED,
            performed_by=self.consultant,
        )
        self.assertEqual(event.to_status, PatentApplicationStatus.APPROVED)

    def test_revised_workflow_full_lifecycle(self):
        review_member = User.objects.create_user(
            email='reviewer@test.edu',
            password='pass1234',
            name='Review Member',
            usn_or_emp_id='EMP9099',
            mobile='9000000099',
            role='review_team',
            department=self.department,
        )

        # 1. Draft -> Submitted
        event1 = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=self.applicant,
            note='Applicant submission.',
        )
        self.assertEqual(event1.to_status, PatentApplicationStatus.SUBMITTED)

        # 2. Submitted -> Under Consultant Review (auto-assigns consultant)
        event2 = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.UNDER_CONSULTANT_REVIEW,
            performed_by=self.consultant,
            note='Consultant evaluating technical novelty.',
        )
        self.assertEqual(event2.to_status, PatentApplicationStatus.UNDER_CONSULTANT_REVIEW)
        self.draft_patent.refresh_from_db()
        self.assertEqual(self.draft_patent.assigned_to, self.consultant)

        # 3. Under Consultant Review -> Under Review Team
        event3 = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.UNDER_REVIEW_TEAM,
            performed_by=self.consultant,
            note='Consultant forwarded to internal review team.',
        )
        self.assertEqual(event3.to_status, PatentApplicationStatus.UNDER_REVIEW_TEAM)

        # 4. Under Review Team -> Pending Final Approval
        event4 = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.PENDING_FINAL_APPROVAL,
            performed_by=review_member,
            note='Committee review meeting completed. Returned to consultant.',
        )
        self.assertEqual(event4.to_status, PatentApplicationStatus.PENDING_FINAL_APPROVAL)

        # 5. Pending Final Approval -> Approved by assigned consultant
        event5 = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.APPROVED,
            performed_by=self.consultant,
            note='Final approval granted.',
        )
        self.assertEqual(event5.to_status, PatentApplicationStatus.APPROVED)
        self.draft_patent.refresh_from_db()
        self.assertEqual(self.draft_patent.status, PatentApplicationStatus.APPROVED)

    def test_stage_gate_document_validation(self):
        from apps.documents.models import Document, DocumentType
        from apps.workflow.exceptions import MissingRequiredDocumentError

        # Submitting with validate_documents=True fails without report
        with self.assertRaises(MissingRequiredDocumentError):
            transition_patent(
                patent=self.draft_patent,
                to_status=PatentApplicationStatus.SUBMITTED,
                performed_by=self.applicant,
                validate_documents=True,
            )

        # Add applicant patent report
        Document.objects.create(
            application=self.draft_patent,
            uploaded_by=self.applicant,
            doc_type=DocumentType.APPLICANT_PATENT_REPORT,
            file='test_report.pdf',
        )

        # Now submission succeeds
        event = transition_patent(
            patent=self.draft_patent,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=self.applicant,
            validate_documents=True,
        )
        self.assertEqual(event.to_status, PatentApplicationStatus.SUBMITTED)
