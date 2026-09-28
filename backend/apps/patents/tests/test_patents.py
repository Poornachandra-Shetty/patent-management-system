import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.patents.models import PatentApplication, PatentApplicationStatus, Inventor
from apps.departments.models import Department

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name="Mechanical Engineering", code="ME")


@pytest.fixture
def applicant(db, department):
    return User.objects.create_user(
        email="applicant@sjec.ac.in",
        name="John Doe",
        usn_or_emp_id="ME-1001",
        mobile="9800000001",
        role="applicant",
        department=department,
        password="password123",
    )


@pytest.fixture
def other_applicant(db, department):
    return User.objects.create_user(
        email="other@sjec.ac.in",
        name="Other Applicant",
        usn_or_emp_id="ME-1002",
        mobile="9800000002",
        role="applicant",
        department=department,
        password="password123",
    )


@pytest.mark.django_db
class TestPatentManagement:
    def test_create_draft_patent_with_inventors(self, api_client, applicant, department):
        api_client.force_authenticate(user=applicant)
        url = reverse("patent-list")
        payload = {
            "title": "Smart Irrigation Robot",
            "department": department.id,
            "category": "AgriTech",
            "abstract": "Automated precision water delivery system.",
            "keywords": "irrigation,robotics,iot",
            "problem_statement": "Water wastage in agriculture.",
            "novelty_description": "Custom ultrasonic moisture sensing array.",
            "proposed_application": "Farming automation.",
            "inventors": [
                {
                    "name": "Co-Inventor One",
                    "usn_or_emp_id": "ME-INV-1",
                    "is_primary_inventor": False,
                }
            ],
        }

        # Fix format of usn_or_emp_id string
        payload["inventors"][0]["usn_or_emp_id"] = "ME-INV-1"

        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Smart Irrigation Robot"
        assert "PAT-" in data["patent_id"]
        assert Inventor.objects.filter(application_id=data["id"]).count() == 1

    def test_update_draft_allowed_but_blocked_when_submitted(self, api_client, applicant, department):
        api_client.force_authenticate(user=applicant)
        patent = PatentApplication.objects.create(
            patent_id="PAT-2026-ME-001",
            applicant=applicant,
            department=department,
            title="Draft Patent Title",
            category="Mechanical",
            abstract="Initial abstract",
            keywords="test",
            problem_statement="Initial problem",
            novelty_description="Initial novelty",
            proposed_application="Initial app",
            status=PatentApplicationStatus.DRAFT,
        )

        detail_url = reverse("patent-detail", kwargs={"pk": patent.pk})

        # 1. Update while in DRAFT -> Success
        patch_response = api_client.patch(detail_url, {"title": "Updated Title In Draft"}, format="json")
        assert patch_response.status_code == status.HTTP_200_OK
        patent.refresh_from_db()
        assert patent.title == "Updated Title In Draft"

        # 2. Transition to SUBMITTED
        patent.status = PatentApplicationStatus.SUBMITTED
        patent.save()

        # 3. Update while in SUBMITTED -> Forbidden (403)
        blocked_response = api_client.patch(detail_url, {"title": "Illegal Edit"}, format="json")
        assert blocked_response.status_code == status.HTTP_403_FORBIDDEN
        patent.refresh_from_db()
        assert patent.title == "Updated Title In Draft"

    def test_delete_draft_allowed_blocked_after_submitted(self, api_client, applicant, department):
        api_client.force_authenticate(user=applicant)
        patent = PatentApplication.objects.create(
            patent_id="PAT-2026-ME-002",
            applicant=applicant,
            department=department,
            title="Draft Patent to Delete",
            category="Mechanical",
            abstract="Initial abstract",
            keywords="test",
            problem_statement="Initial problem",
            novelty_description="Initial novelty",
            proposed_application="Initial app",
            status=PatentApplicationStatus.DRAFT,
        )

        detail_url = reverse("patent-detail", kwargs={"pk": patent.pk})

        # Submit it
        patent.status = PatentApplicationStatus.SUBMITTED
        patent.save()

        # Try delete -> 403 Forbidden
        delete_response = api_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN
        assert PatentApplication.objects.filter(pk=patent.pk).exists()
