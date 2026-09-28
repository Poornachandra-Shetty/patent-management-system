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

# Production Security Headers & SSL Hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
