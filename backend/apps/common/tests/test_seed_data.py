from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient


User = get_user_model()


class SeedDataCommandTestCase(TestCase):
    @override_settings(DEBUG=False)
    def test_seed_data_refuses_when_debug_false(self):
        with self.assertRaises(CommandError) as ctx:
            call_command('seed_data')
        self.assertIn('DEBUG is False', str(ctx.exception))

    @override_settings(DEBUG=True)
    def test_seeded_demo_account_can_log_in_and_legacy_email_is_upgraded(self):
        call_command('seed_data')
        user = User.objects.get(usn_or_emp_id='USN2026001')
        self.assertEqual(user.email, 'student@sjec.ac.in')

        user.email = 'student@college.edu'
        user.save(update_fields=['email'])
        call_command('seed_data')
        user.refresh_from_db()
        self.assertEqual(user.email, 'student@sjec.ac.in')

        client = APIClient()
        response = client.post(
            reverse('token_obtain_pair'),
            {'email': user.email, 'password': 'password123'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
