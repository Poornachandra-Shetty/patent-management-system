import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.departments.models import Department
from apps.reviews.models import Remark, RemarkAction

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name="Electronics & Communication", code="ECE")


@pytest.fixture
def applicant(db, department):
    return User.objects.create_user(
        email="applicant_ece@sjec.ac.in",
        name="Alice ECE",
        usn_or_emp_id="ECE-101",
        mobile="9811111111",
        role="applicant",
        department=department,
        password="password123",
    )


@pytest.fixture
def consultant(db, department):
    return User.objects.create_user(
        email="consultant_ece@sjec.ac.in",
        name="Prof. Reviewer",
        usn_or_emp_id="CON-202",
        mobile="9822222222",
        role="consultant",
        department=department,
        password="password123",
    )


@pytest.fixture
def scrutinizer(db, department):
    return User.objects.create_user(
        email="scrutinizer_ece@sjec.ac.in",
        name="Dr. Scrutinizer",
        usn_or_emp_id="SCR-303",
        mobile="9833333333",
        role="scrutinizer",
        department=department,
        password="password123",
    )


@pytest.fixture
def patent(db, applicant, consultant, department):
    return PatentApplication.objects.create(
        patent_id="PAT-2026-ECE-001",
        applicant=applicant,
        assigned_to=consultant,
        department=department,
        title="Novel Microstrip Antenna",
        category="Wireless",
        abstract="Antenna design for 6G.",
        keywords="antenna,6g,rf",
        problem_statement="Bandwidth limits",
        novelty_description="Fractal geometry",
        proposed_application="High speed telecom",
        status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
    )


@pytest.mark.django_db
class TestReviewsAndRemarks:
    def test_internal_remark_hidden_from_applicant(self, api_client, applicant, scrutinizer, patent):
        # Scrutinizer adds an internal remark
        internal_remark = Remark.objects.create(
            application=patent,
            user=scrutinizer,
            text="Prior art check reveals potential conflict with US Patent 12345.",
            action=RemarkAction.COMMENT,
            visible_to_applicant=False,
        )

        # Scrutinizer adds a public remark
        public_remark = Remark.objects.create(
            application=patent,
            user=scrutinizer,
            text="Please provide clarification on claims 3-5.",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True,
        )

        url = reverse("remark-list")

        # 1. Applicant views remarks -> Only sees public_remark
        api_client.force_authenticate(user=applicant)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json().get("results", response.json())
        remark_ids = [r["id"] for r in data]
        assert public_remark.id in remark_ids
        assert internal_remark.id not in remark_ids

        # 2. Scrutinizer views remarks -> Sees both
        api_client.force_authenticate(user=scrutinizer)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json().get("results", response.json())
        remark_ids = [r["id"] for r in data]
        assert internal_remark.id in remark_ids
        assert public_remark.id in remark_ids

    def test_consultant_can_submit_evaluation_remark(self, api_client, consultant, patent):
        api_client.force_authenticate(user=consultant)
        url = reverse("remark-list")
        payload = {
            "application": patent.id,
            "text": "Technical claims are verified and novel.",
            "action": RemarkAction.APPROVED,
            "visible_to_applicant": True,
        }

        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Remark.objects.filter(application=patent, user=consultant).count() == 1
