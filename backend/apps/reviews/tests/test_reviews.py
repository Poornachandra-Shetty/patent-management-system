from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.departments.models import Department
from apps.reviews.models import Remark, RemarkAction

User = get_user_model()


class ReviewsAndRemarksTestCase(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(name="Electronics & Communication", code="ECE")
        self.applicant = User.objects.create_user(
            email="applicant_ece@sjec.ac.in",
            name="Alice ECE",
            usn_or_emp_id="ECE-101",
            mobile="9811111111",
            role="applicant",
            department=self.department,
            password="password123",
        )
        self.consultant = User.objects.create_user(
            email="consultant_ece@sjec.ac.in",
            name="Prof. Reviewer",
            usn_or_emp_id="CON-202",
            mobile="9822222222",
            role="consultant",
            department=self.department,
            password="password123",
        )
        self.scrutinizer = User.objects.create_user(
            email="scrutinizer_ece@sjec.ac.in",
            name="Dr. Scrutinizer",
            usn_or_emp_id="SCR-303",
            mobile="9833333333",
            role="scrutinizer",
            department=self.department,
            password="password123",
        )
        self.patent = PatentApplication.objects.create(
            patent_id="PAT-2026-ECE-001",
            applicant=self.applicant,
            assigned_to=self.consultant,
            department=self.department,
            title="Novel Microstrip Antenna",
            category="Wireless",
            abstract="Antenna design for 6G.",
            keywords="antenna,6g,rf",
            problem_statement="Bandwidth limits",
            novelty_description="Fractal geometry",
            proposed_application="High speed telecom",
            status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
        )

    def test_internal_remark_hidden_from_applicant(self):
        internal_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer,
            text="Prior art check reveals potential conflict with US Patent 12345.",
            action=RemarkAction.COMMENT,
            visible_to_applicant=False,
        )
        public_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer,
            text="Please provide clarification on claims 3-5.",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True,
        )

        url = reverse("remark-list")

        # 1. Applicant views remarks -> Only sees public_remark
        self.client.force_authenticate(user=self.applicant)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("results", response.json())
        remark_ids = [r["id"] for r in data]
        self.assertIn(public_remark.id, remark_ids)
        self.assertNotIn(internal_remark.id, remark_ids)

        # 2. Scrutinizer views remarks -> Sees both
        self.client.force_authenticate(user=self.scrutinizer)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("results", response.json())
        remark_ids = [r["id"] for r in data]
        self.assertIn(internal_remark.id, remark_ids)
        self.assertIn(public_remark.id, remark_ids)

    def test_consultant_can_submit_evaluation_remark(self):
        self.client.force_authenticate(user=self.consultant)
        url = reverse("remark-list")
        payload = {
            "application": self.patent.id,
            "text": "Technical claims are verified and novel.",
            "action": RemarkAction.APPROVED,
            "visible_to_applicant": True,
        }

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Remark.objects.filter(application=self.patent, user=self.consultant).count(), 1)

    def test_applicant_cannot_change_action_or_visibility_on_update(self):
        # Applicant creates a remark
        remark = Remark.objects.create(
            application=self.patent,
            user=self.applicant,
            text="Original applicant question.",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True,
        )

        self.client.force_authenticate(user=self.applicant)
        url = reverse("remark-detail", args=[remark.id])
        payload = {
            "text": "Updated applicant text.",
            "action": RemarkAction.APPROVED,
            "visible_to_applicant": False,
        }

        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        remark.refresh_from_db()
        self.assertEqual(remark.text, "Updated applicant text.")
        # Ensure action and visible_to_applicant were not changed
        self.assertEqual(remark.action, RemarkAction.COMMENT)
        self.assertEqual(remark.visible_to_applicant, True)

    def test_oversized_remark_text_rejected(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse("remark-list")
        payload = {
            "application": self.patent.id,
            "text": "A" * 5001,
            "action": RemarkAction.COMMENT,
            "visible_to_applicant": True,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

