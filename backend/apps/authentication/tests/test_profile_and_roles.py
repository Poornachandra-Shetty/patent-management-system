from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.departments.models import Department

User = get_user_model()


class ProfileAndRoleSecurityTestCase(APITestCase):
    def setUp(self):
        self.dept1 = Department.objects.create(name='Computer Science', code='CSE')
        self.dept2 = Department.objects.create(name='Electronics', code='ECE')

        self.applicant = User.objects.create_user(
            name='Applicant Test',
            email='applicant@college.edu',
            usn_or_emp_id='USN001',
            mobile='9999999999',
            role='applicant',
            department=self.dept1,
            password='password123',
        )
        self.admin_user = User.objects.create_user(
            name='Admin User',
            email='admin@college.edu',
            usn_or_emp_id='ADMIN001',
            mobile='7777777777',
            role='admin',
            department=self.dept1,
            password='password123',
        )

    def test_applicant_patch_role_and_department_ignored(self):
        self.client.force_authenticate(user=self.applicant)
        response = self.client.patch(
            reverse('auth_profile'),
            {
                'name': 'Updated Name',
                'role': 'admin',
                'department': self.dept2.id,
                'is_staff': True,
                'is_superuser': True,
                'email': 'hacked@college.edu',
                'usn_or_emp_id': 'HACKED001',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.name, 'Updated Name')
        self.assertEqual(self.applicant.role, 'applicant')
        self.assertEqual(self.applicant.department, self.dept1)
        self.assertEqual(self.applicant.is_staff, False)
        self.assertEqual(self.applicant.is_superuser, False)
        self.assertEqual(self.applicant.email, 'applicant@college.edu')
        self.assertEqual(self.applicant.usn_or_emp_id, 'USN001')

    def test_registration_cannot_set_role(self):
        response = self.client.post(
            reverse('auth_register'),
            {
                'name': 'New Guy',
                'email': 'newguy@sjec.ac.in',
                'usn_or_emp_id': 'USN002',
                'mobile': '8888888888',
                'department': self.dept1.id,
                'password': 'password123',
                'role': 'admin',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email='newguy@sjec.ac.in')
        self.assertEqual(created_user.role, 'applicant')

    def test_admin_can_update_user_role_via_admin_endpoint(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-users-detail', args=[self.applicant.id])
        response = self.client.patch(url, {'role': 'scrutinizer'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.role, 'scrutinizer')

    def test_non_admin_cannot_access_admin_user_endpoint(self):
        self.client.force_authenticate(user=self.applicant)
        url = reverse('admin-users-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
