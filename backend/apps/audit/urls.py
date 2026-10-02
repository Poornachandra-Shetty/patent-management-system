from django.urls import path
from apps.audit.views import AuditTrailView, PatentAuditListView

urlpatterns = [
    path('patents/<str:patent_id>/', AuditTrailView.as_view(), name='audit-trail'),
    path('', PatentAuditListView.as_view(), name='audit-list'),
]
