from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.departments.models import Department
from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.workflow.models import WorkflowEvent

User = get_user_model()


class WorkflowAPITestCase(APITestCase):
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

    def test_transition_submit_creates_event(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse('workflow-transition', kwargs={'patent_id': self.draft_patent.patent_id})

        response = self.client.post(url, {'to_status': PatentApplicationStatus.SUBMITTED}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['from_status'], PatentApplicationStatus.DRAFT)
        self.assertEqual(response.data['to_status'], PatentApplicationStatus.SUBMITTED)
        self.assertEqual(WorkflowEvent.objects.count(), 1)

    def test_allowed_transitions_for_applicant(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse('workflow-allowed', kwargs={'patent_id': self.draft_patent.patent_id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['allowed_transitions'], [PatentApplicationStatus.SUBMITTED])

    def test_history_denied_for_other_applicant(self):
        self.client.force_authenticate(user=self.other_applicant)
        url = reverse('workflow-history', kwargs={'patent_id': self.draft_patent.patent_id})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patent_submit_endpoint_uses_workflow(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse('patent-submit', kwargs={'pk': self.draft_patent.pk})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], PatentApplicationStatus.SUBMITTED)
        self.assertEqual(WorkflowEvent.objects.count(), 1)
