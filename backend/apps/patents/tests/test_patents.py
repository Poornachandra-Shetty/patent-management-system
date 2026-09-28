import concurrent.futures
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection

from apps.patents.models import PatentApplication, PatentApplicationStatus, Inventor
from apps.patents.id_generator import generate_patent_id
from apps.departments.models import Department

User = get_user_model()


class PatentManagementTestCase(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(name="Mechanical Engineering", code="ME")
        self.applicant = User.objects.create_user(
            email="applicant@sjec.ac.in",
            name="John Doe",
            usn_or_emp_id="ME-1001",
            mobile="9800000001",
            role="applicant",
            department=self.department,
            password="password123",
        )
        self.other_applicant = User.objects.create_user(
            email="other@sjec.ac.in",
            name="Other Applicant",
            usn_or_emp_id="ME-1002",
            mobile="9800000002",
            role="applicant",
            department=self.department,
            password="password123",
        )

    def test_create_draft_patent_with_inventors(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse("patent-list")
        payload = {
            "title": "Smart Irrigation Robot",
            "department": self.department.id,
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

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["title"], "Smart Irrigation Robot")
        self.assertIn("PAT-", data["patent_id"])
        self.assertEqual(Inventor.objects.filter(application_id=data["id"]).count(), 1)

    def test_update_draft_allowed_but_blocked_when_submitted(self):
        self.client.force_authenticate(user=self.applicant)
        patent = PatentApplication.objects.create(
            patent_id="PAT-2026-ME-001",
            applicant=self.applicant,
            department=self.department,
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
        patch_response = self.client.patch(detail_url, {"title": "Updated Title In Draft"}, format="json")
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        patent.refresh_from_db()
        self.assertEqual(patent.title, "Updated Title In Draft")

        # 2. Transition to SUBMITTED
        patent.status = PatentApplicationStatus.SUBMITTED
        patent.save()

        # 3. Update while in SUBMITTED -> Forbidden (403)
        blocked_response = self.client.patch(detail_url, {"title": "Illegal Edit"}, format="json")
        self.assertEqual(blocked_response.status_code, status.HTTP_403_FORBIDDEN)
        patent.refresh_from_db()
        self.assertEqual(patent.title, "Updated Title In Draft")

    def test_delete_draft_allowed_blocked_after_submitted(self):
        self.client.force_authenticate(user=self.applicant)
        patent = PatentApplication.objects.create(
            patent_id="PAT-2026-ME-002",
            applicant=self.applicant,
            department=self.department,
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
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(PatentApplication.objects.filter(pk=patent.pk).exists())


import unittest


class PatentIDGenerationTestCase(TransactionTestCase):
    def test_sequential_id_generation(self):
        department = Department.objects.create(name="Computer Science", code="CS")
        generated_ids = [generate_patent_id(department) for _ in range(5)]
        self.assertEqual(len(generated_ids), 5)
        self.assertEqual(len(set(generated_ids)), 5)
        for i in range(1, 6):
            expected_suffix = str(i).zfill(3)
            self.assertTrue(generated_ids[i - 1].endswith(expected_suffix))

    @unittest.skipUnless(connection.vendor == 'postgresql', 'Requires PostgreSQL row-level locks for concurrent thread testing')
    def test_concurrent_id_generation_no_duplicates_on_postgresql(self):
        department = Department.objects.create(name="Information Science", code="IS")

        def worker():
            connection.close()
            return generate_patent_id(department)

        num_threads = 10
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            generated_ids = [f.result() for f in futures]

        self.assertEqual(len(generated_ids), num_threads)
        self.assertEqual(len(set(generated_ids)), num_threads)
        for i in range(1, num_threads + 1):
            expected_suffix = str(i).zfill(3)
            self.assertTrue(any(gid.endswith(expected_suffix) for gid in generated_ids))
