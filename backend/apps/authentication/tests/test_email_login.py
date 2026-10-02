from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.departments.models import Department

User = get_user_model()


class EmailLoginTestCase(APITestCase):
    def test_login_with_email_returns_tokens(self):
        department = Department.objects.create(name='Computer Science & Engineering', code='CSE')
        user = User.objects.create_user(
            name='Admin User',
            email='admin@sjec.ac.in',
            usn_or_emp_id='EMP001',
            mobile='9876543210',
            role='admin',
            department=department,
            password='password123',
        )

        response = self.client.post(
            reverse('token_obtain_pair'),
            {'email': 'admin@sjec.ac.in', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], user.email)
