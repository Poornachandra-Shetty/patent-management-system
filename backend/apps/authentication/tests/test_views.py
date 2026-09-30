import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


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
