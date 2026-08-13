from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints v1
    path('api/v1/departments/', include('apps.departments.urls')),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/patents/', include('apps.patents.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/reviews/', include('apps.reviews.urls')),
    path('api/v1/workflow/', include('apps.workflow.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
