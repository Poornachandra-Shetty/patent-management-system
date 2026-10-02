import os
from datetime import timedelta
from unittest import mock
from django.test import SimpleTestCase
from django.core.exceptions import ImproperlyConfigured


class ProdSettingsTestCase(SimpleTestCase):
    def test_prod_jwt_and_cors_settings(self):
        with mock.patch.dict(os.environ, {
            'SECRET_KEY': 'production-test-key-with-very-high-entropy-security',
            'DATABASE_URL': 'postgres://user:pass@localhost:5432/patent_prod',
        }):
            import importlib
            import config.settings.prod as prod_settings
            importlib.reload(prod_settings)

            self.assertEqual(prod_settings.DEBUG, False)
            self.assertEqual(prod_settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'], timedelta(minutes=15))
            self.assertEqual(prod_settings.CORS_ALLOW_ALL_ORIGINS, False)

    def test_prod_rejects_sqlite(self):
        with mock.patch.dict(os.environ, {
            'SECRET_KEY': 'production-test-key-with-very-high-entropy-security',
            'DATABASE_URL': 'sqlite:///db.sqlite3',
        }):
            import importlib
            with self.assertRaises(ImproperlyConfigured) as ctx:
                import config.settings.prod as prod_settings
                importlib.reload(prod_settings)
            self.assertIn("SQLite database engine is not permitted", str(ctx.exception))
