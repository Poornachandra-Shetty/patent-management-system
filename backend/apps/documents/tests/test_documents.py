import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.departments.models import Department
from apps.documents.models import Document, DocumentType, PublicDocument, PublicDocumentCategory
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name="Computer Science & Engineering", code="CSE")


@pytest.fixture
def applicant_user(db, department):
    return User.objects.create_user(
        email="applicant@sjec.ac.in",
        name="Jane Applicant",
        usn_or_emp_id="USN-101",
        mobile="9876543210",
        role="applicant",
        department=department,
        password="password123",
    )


@pytest.fixture
def other_applicant(db, department):
    return User.objects.create_user(
        email="other@sjec.ac.in",
        name="Other Applicant",
        usn_or_emp_id="USN-102",
        mobile="9876543211",
        role="applicant",
        department=department,
        password="password123",
    )


@pytest.fixture
def admin_user(db, department):
    return User.objects.create_user(
        email="admin@sjec.ac.in",
        name="Admin User",
        usn_or_emp_id="ADM-001",
        mobile="9876543212",
        role="admin",
        is_staff=True,
        password="password123",
    )


@pytest.fixture
def consultant_user(db, department):
    return User.objects.create_user(
        email="consultant@sjec.ac.in",
        name="Consultant User",
        usn_or_emp_id="CON-001",
        mobile="9876543213",
        role="consultant",
        password="password123",
    )


@pytest.fixture
def patent(db, applicant_user, department, consultant_user):
    return PatentApplication.objects.create(
        patent_id="PAT-2026-0001",
        applicant=applicant_user,
        assigned_to=consultant_user,
        department=department,
        title="Novel Solar Cell Design",
        category="Solar Tech",
        abstract="Detailed abstract",
        keywords="solar,energy",
        problem_statement="Inefficiency",
        novelty_description="New coating",
        proposed_application="Power generation",
        status=PatentApplicationStatus.DRAFT,
    )


@pytest.mark.django_db
class TestDocumentSecurity:
    def test_applicant_can_upload_document_to_own_draft(self, api_client, applicant_user, patent):
        api_client.force_authenticate(user=applicant_user)
        dummy_file = SimpleUploadedFile("spec.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")

        url = reverse("document-list")
        response = api_client.post(
            url,
            {
                "application": patent.id,
                "doc_type": DocumentType.PATENT_FORM,
                "file": dummy_file,
            },
            format="multipart",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Document.objects.filter(application=patent).count() == 1
        doc = Document.objects.first()
        assert doc.uploaded_by == applicant_user
        assert doc.file_size > 0
        assert "pdf" in doc.mime_type

    def test_other_applicant_cannot_upload_to_another_patent(self, api_client, other_applicant, patent):
        api_client.force_authenticate(user=other_applicant)
        dummy_file = SimpleUploadedFile("spec.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")

        url = reverse("document-list")
        response = api_client.post(
            url,
            {
                "application": patent.id,
                "doc_type": DocumentType.PATENT_FORM,
                "file": dummy_file,
            },
            format="multipart",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_document_download_permission_isolation(self, api_client, applicant_user, other_applicant, consultant_user, admin_user, patent):
        dummy_file = SimpleUploadedFile("confidential.pdf", b"%PDF-1.4 confidential spec", content_type="application/pdf")
        doc = Document.objects.create(
            application=patent,
            uploaded_by=applicant_user,
            doc_type=DocumentType.SUPPORTING_DOCUMENTS,
            file=dummy_file,
            mime_type="application/pdf",
        )

        download_url = reverse("document-download", kwargs={"pk": doc.pk})

        # 1. Unauthenticated -> 401
        response = api_client.get(download_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # 2. Other unrelated applicant -> 404 (due to queryset filtering) / 403
        api_client.force_authenticate(user=other_applicant)
        response = api_client.get(download_url)
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

        # 3. Owner applicant -> 200 FileResponse
        api_client.force_authenticate(user=applicant_user)
        response = api_client.get(download_url)
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"

        # 4. Assigned Consultant -> 200 FileResponse
        api_client.force_authenticate(user=consultant_user)
        response = api_client.get(download_url)
        assert response.status_code == status.HTTP_200_OK

        # 5. Admin -> 200 FileResponse
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(download_url)
        assert response.status_code == status.HTTP_200_OK
