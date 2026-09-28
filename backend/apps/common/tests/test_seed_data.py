from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings


class SeedDataCommandTestCase(TestCase):
    @override_settings(DEBUG=False)
    def test_seed_data_refuses_when_debug_false(self):
        with self.assertRaises(CommandError) as ctx:
            call_command('seed_data')
        self.assertIn('DEBUG is False', str(ctx.exception))
