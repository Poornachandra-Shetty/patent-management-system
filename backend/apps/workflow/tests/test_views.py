import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.patents.models import PatentApplicationStatus
from apps.workflow.models import WorkflowEvent


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestWorkflowAPI:
    def test_transition_submit_creates_event(self, api_client, draft_patent, applicant):
        api_client.force_authenticate(user=applicant)
        url = reverse('workflow-transition', kwargs={'patent_id': draft_patent.patent_id})

        response = api_client.post(url, {'to_status': PatentApplicationStatus.SUBMITTED}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['from_status'] == PatentApplicationStatus.DRAFT
        assert response.data['to_status'] == PatentApplicationStatus.SUBMITTED
        assert WorkflowEvent.objects.count() == 1

    def test_allowed_transitions_for_applicant(self, api_client, draft_patent, applicant):
        api_client.force_authenticate(user=applicant)
        url = reverse('workflow-allowed', kwargs={'patent_id': draft_patent.patent_id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['allowed_transitions'] == [PatentApplicationStatus.SUBMITTED]

    def test_history_denied_for_other_applicant(
        self, api_client, draft_patent, other_applicant
    ):
        api_client.force_authenticate(user=other_applicant)
        url = reverse('workflow-history', kwargs={'patent_id': draft_patent.patent_id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patent_submit_endpoint_uses_workflow(
        self, api_client, draft_patent, applicant
    ):
        api_client.force_authenticate(user=applicant)
        url = reverse('patent-submit', kwargs={'pk': draft_patent.pk})

        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == PatentApplicationStatus.SUBMITTED
        assert WorkflowEvent.objects.count() == 1
