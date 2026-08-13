import dj_database_url
from .base import *

DEBUG = False

DATABASES = {
    'default': config(
        'DATABASE_URL',
        default=f"postgres://{config('DB_USER', 'postgres')}:{config('DB_PASSWORD', 'postgres')}@{config('DB_HOST', 'localhost')}:{config('DB_PORT', '5432')}/{config('DB_NAME', 'patent_db')}",
        cast=dj_database_url.parse
    )
}

# Production Security Headers
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
