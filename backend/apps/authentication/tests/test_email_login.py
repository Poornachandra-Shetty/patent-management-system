import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model
from apps.departments.models import Department

User = get_user_model()


@pytest.mark.django_db
def test_login_with_email_returns_tokens():
    department = Department.objects.create(name='Computer Science & Engineering', code='CSE')
    user = User.objects.create_user(
        name='Admin User',
        email='admin@college.edu',
        usn_or_emp_id='EMP001',
        mobile='9876543210',
        role='admin',
        department=department,
        password='password123',
    )

    client = APIClient()
    response = client.post(
        reverse('token_obtain_pair'),
        {'email': 'admin@college.edu', 'password': 'password123'},
        format='json',
    )

    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['email'] == user.email
