from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.departments.models import Department

User = get_user_model()


class AdminOnlyEndpointsSecurityTestCase(APITestCase):
    def setUp(self):
        self.dept = Department.objects.create(name='Computer Science', code='CSE')

        self.applicant = User.objects.create_user(
            name='Applicant User',
            email='applicant@college.edu',
            usn_or_emp_id='USN001',
            mobile='9000000001',
            role='applicant',
            department=self.dept,
            password='password123',
        )
        self.scrutinizer = User.objects.create_user(
            name='Scrutinizer User',
            email='scrutinizer@college.edu',
            usn_or_emp_id='EMP002',
            mobile='9000000002',
            role='scrutinizer',
            department=self.dept,
            password='password123',
        )
        self.consultant = User.objects.create_user(
            name='Consultant User',
            email='consultant@college.edu',
            usn_or_emp_id='EMP003',
            mobile='9000000003',
            role='consultant',
            department=self.dept,
            password='password123',
        )
        self.admin = User.objects.create_user(
            name='Admin User',
            email='admin@college.edu',
            usn_or_emp_id='ADMIN001',
            mobile='9000000004',
            role='admin',
            department=self.dept,
            password='password123',
        )

    def test_unauthenticated_access_denied(self):
        url = reverse('admin-users-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_applicant_gets_403_on_admin_user_endpoints(self):
        self.client.force_authenticate(user=self.applicant)
        list_url = reverse('admin-users-list')
        detail_url = reverse('admin-users-detail', args=[self.scrutinizer.id])

        # GET list
        self.assertEqual(self.client.get(list_url).status_code, status.HTTP_403_FORBIDDEN)
        # GET detail
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        # PATCH detail
        self.assertEqual(self.client.patch(detail_url, {'role': 'admin'}).status_code, status.HTTP_403_FORBIDDEN)
        # DELETE detail
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_scrutinizer_gets_403_on_admin_user_endpoints(self):
        self.client.force_authenticate(user=self.scrutinizer)
        list_url = reverse('admin-users-list')
        detail_url = reverse('admin-users-detail', args=[self.applicant.id])

        self.assertEqual(self.client.get(list_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(detail_url, {'role': 'admin'}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_consultant_gets_403_on_admin_user_endpoints(self):
        self.client.force_authenticate(user=self.consultant)
        list_url = reverse('admin-users-list')
        detail_url = reverse('admin-users-detail', args=[self.applicant.id])

        self.assertEqual(self.client.get(list_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(detail_url, {'role': 'admin'}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(detail_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_gets_200_and_can_manage_users(self):
        self.client.force_authenticate(user=self.admin)
        list_url = reverse('admin-users-list')
        detail_url = reverse('admin-users-detail', args=[self.applicant.id])

        # GET list
        list_resp = self.client.get(list_url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)

        # GET detail
        detail_resp = self.client.get(detail_url)
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)

        # PATCH role
        patch_resp = self.client.patch(detail_url, {'role': 'scrutinizer'}, format='json')
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.role, 'scrutinizer')
