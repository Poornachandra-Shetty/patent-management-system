import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.departments.models import Department

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def department(db):
    return Department.objects.create(name='Computer Science & Engineering', code='CSE')


@pytest.fixture
def sjec_user(db):
    return User.objects.create_user(
        email='student@sjec.ac.in',
        password='valid-password',
        name='Test Student',
        usn_or_emp_id='STUDENT1001',
        mobile='9000000001',
    )


@pytest.mark.django_db
def test_login_allows_sjec_email_with_valid_credentials(api_client, sjec_user):
    response = api_client.post(
        reverse('token_obtain_pair'),
        {'email': sjec_user.email, 'password': 'valid-password'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['id'] == sjec_user.id
    assert response.data['user']['name'] == sjec_user.name
    assert response.data['user']['email'] == sjec_user.email
    assert response.data['user']['role'] == sjec_user.role
    assert response.data['user']['department'] == sjec_user.department


@pytest.mark.parametrize(
    'email',
    [
        'student@gmail.com',
        'student@sjec.edu.in',
        'STUDENT@SJEC.AC.IN',
        'student@SJEC.AC.IN',
        'student@sjec.ac.in.fake',
    ],
)
@pytest.mark.django_db
def test_login_rejects_non_sjec_email(api_client, email):
    response = api_client.post(
        reverse('token_obtain_pair'),
        {'email': email, 'password': 'valid-password'},
        format='json',
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'email' in response.data


@pytest.mark.django_db
def test_register_allows_valid_sjec_email(api_client, department):
    payload = {
        'name': 'New Student',
        'email': 'newstudent@sjec.ac.in',
        'password': 'valid-password',
        'usn_or_emp_id': 'STUDENT2002',
        'mobile': '9000000002',
        'department': department.id,
    }

    response = api_client.post(reverse('auth_register'), payload, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    created_user = User.objects.get(email='newstudent@sjec.ac.in')
    assert created_user.role == 'applicant'
    assert created_user.usn_or_emp_id == 'STUDENT2002'
    assert created_user.department == department


@pytest.mark.parametrize(
    'email',
    [
        'student@gmail.com',
        'student@sjec.edu.in',
        'STUDENT@SJEC.AC.IN',
        'student@SJEC.AC.IN',
        'student@sjec.ac.in.fake',
    ],
)
@pytest.mark.django_db
def test_register_rejects_non_sjec_email(api_client, department, email):
    payload = {
        'name': 'Rejected Student',
        'email': email,
        'password': 'valid-password',
        'usn_or_emp_id': 'STUDENT9999',
        'mobile': '9000000009',
        'department': department.id,
    }

    response = api_client.post(reverse('auth_register'), payload, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'email' in response.data
    assert not User.objects.filter(email=email).exists()


@pytest.mark.django_db
def test_register_requires_usn_or_emp_id(api_client, department):
    payload = {
        'name': 'No USN',
        'email': 'nouser@sjec.ac.in',
        'password': 'valid-password',
        'mobile': '9000000010',
        'department': department.id,
    }

    response = api_client.post(reverse('auth_register'), payload, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'usn_or_emp_id' in response.data


@pytest.mark.django_db
def test_register_defaults_to_applicant_role_and_ignores_client_role(api_client, department):
    payload = {
        'name': 'Role Tester',
        'email': 'roleuser@sjec.ac.in',
        'password': 'valid-password',
        'usn_or_emp_id': 'EMP777',
        'mobile': '9000000011',
        'department': department.id,
        'role': 'admin',
    }

    response = api_client.post(reverse('auth_register'), payload, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    created_user = User.objects.get(email='roleuser@sjec.ac.in')
    assert created_user.role == 'applicant'


@pytest.mark.django_db
def test_register_uses_selected_department(api_client, department):
    payload = {
        'name': 'Dept User',
        'email': 'deptuser@sjec.ac.in',
        'password': 'valid-password',
        'usn_or_emp_id': 'STUDENT5555',
        'mobile': '9000000012',
        'department': department.id,
    }

    response = api_client.post(reverse('auth_register'), payload, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    created_user = User.objects.get(email='deptuser@sjec.ac.in')
    assert created_user.department_id == department.id
