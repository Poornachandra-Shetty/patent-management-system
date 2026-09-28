import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.departments.models import Department
from apps.documents.models import Document, DocumentType
from django.contrib.auth import get_user_model

User = get_user_model()


class DocumentSecurityTestCase(APITestCase):
    def setUp(self):
        self.dept = Department.objects.create(name="Computer Science & Engineering", code="CSE")
        self.applicant = User.objects.create_user(
            email="applicant@sjec.ac.in",
            name="Jane Applicant",
            usn_or_emp_id="USN-101",
            mobile="9876543210",
            role="applicant",
            department=self.dept,
            password="password123",
        )
        self.other_applicant = User.objects.create_user(
            email="other@sjec.ac.in",
            name="Other Applicant",
            usn_or_emp_id="USN-102",
            mobile="9876543211",
            role="applicant",
            department=self.dept,
            password="password123",
        )
        self.consultant = User.objects.create_user(
            email="consultant@sjec.ac.in",
            name="Consultant User",
            usn_or_emp_id="CON-001",
            mobile="9876543213",
            role="consultant",
            password="password123",
        )
        self.admin = User.objects.create_user(
            email="admin@sjec.ac.in",
            name="Admin User",
            usn_or_emp_id="ADM-001",
            mobile="9876543212",
            role="admin",
            is_staff=True,
            password="password123",
        )
        self.patent = PatentApplication.objects.create(
            patent_id="PAT-2026-0001",
            applicant=self.applicant,
            assigned_to=self.consultant,
            department=self.dept,
            title="Novel Solar Cell Design",
            category="Solar Tech",
            abstract="Detailed abstract",
            keywords="solar,energy",
            problem_statement="Inefficiency",
            novelty_description="New coating",
            proposed_application="Power generation",
            status=PatentApplicationStatus.DRAFT,
        )

    def test_applicant_can_upload_valid_document(self):
        self.client.force_authenticate(user=self.applicant)
        pdf_content = b"%PDF-1.4 header and content for testing"
        dummy_file = SimpleUploadedFile("spec.pdf", pdf_content, content_type="application/pdf")

        url = reverse("document-list")
        response = self.client.post(
            url,
            {
                "application": self.patent.id,
                "doc_type": DocumentType.PATENT_FORM,
                "file": dummy_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.filter(application=self.patent).count(), 1)
        doc = Document.objects.first()
        self.assertEqual(doc.uploaded_by, self.applicant)
        self.assertEqual(doc.mime_type, "application/pdf")
        self.assertGreater(doc.file_size, 0)

    def test_exe_file_upload_rejected(self):
        self.client.force_authenticate(user=self.applicant)
        exe_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode."
        dummy_file = SimpleUploadedFile("malware.exe", exe_content, content_type="application/x-msdownload")

        url = reverse("document-list")
        response = self.client.post(
            url,
            {
                "application": self.patent.id,
                "doc_type": DocumentType.SUPPORTING_DOCUMENTS,
                "file": dummy_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_file_upload_rejected(self):
        self.client.force_authenticate(user=self.applicant)
        # Create a file > 10MB (10MB + 1KB)
        large_content = b"%PDF-1.4 " + b"0" * (10 * 1024 * 1024 + 1024)
        dummy_file = SimpleUploadedFile("large.pdf", large_content, content_type="application/pdf")

        url = reverse("document-list")
        response = self.client.post(
            url,
            {
                "application": self.patent.id,
                "doc_type": DocumentType.SUPPORTING_DOCUMENTS,
                "file": dummy_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_spoofed_mime_type_upload_rejected(self):
        self.client.force_authenticate(user=self.applicant)
        # File named .pdf but containing executable content
        spoofed_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode."
        dummy_file = SimpleUploadedFile("spoofed.pdf", spoofed_content, content_type="application/pdf")

        url = reverse("document-list")
        response = self.client.post(
            url,
            {
                "application": self.patent.id,
                "doc_type": DocumentType.SUPPORTING_DOCUMENTS,
                "file": dummy_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_download_filename_with_quotes_and_newlines_sanitized(self):
        self.client.force_authenticate(user=self.applicant)
        pdf_content = b"%PDF-1.4 test document"
        # Save document with filename containing quotes/newlines
        dummy_file = SimpleUploadedFile("test\r\n\"bad\".pdf", pdf_content, content_type="application/pdf")
        doc = Document.objects.create(
            application=self.patent,
            uploaded_by=self.applicant,
            doc_type=DocumentType.SUPPORTING_DOCUMENTS,
            file=dummy_file,
            mime_type="application/pdf",
        )

        download_url = reverse("document-download", kwargs={"pk": doc.pk})
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cd = response.get("Content-Disposition", "")
        self.assertNotIn("\r", cd)
        self.assertNotIn("\n", cd)
        # Ensure it contains attachment with clean filename
        self.assertTrue(cd.startswith('attachment; filename="'))
        self.assertTrue(cd.endswith('"'))

    def test_document_download_permission_isolation(self):
        pdf_content = b"%PDF-1.4 confidential spec"
        dummy_file = SimpleUploadedFile("confidential.pdf", pdf_content, content_type="application/pdf")
        doc = Document.objects.create(
            application=self.patent,
            uploaded_by=self.applicant,
            doc_type=DocumentType.SUPPORTING_DOCUMENTS,
            file=dummy_file,
            mime_type="application/pdf",
        )

        download_url = reverse("document-download", kwargs={"pk": doc.pk})

        # 1. Unauthenticated -> 401
        self.client.logout()
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Other unrelated applicant -> 404 / 403
        self.client.force_authenticate(user=self.other_applicant)
        response = self.client.get(download_url)
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        # 3. Owner applicant -> 200 FileResponse
        self.client.force_authenticate(user=self.applicant)
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

        # 4. Assigned Consultant -> 200 FileResponse
        self.client.force_authenticate(user=self.consultant)
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 5. Admin -> 200 FileResponse
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(download_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
