from rest_framework.routers import DefaultRouter
from apps.documents.views import DocumentViewSet, PublicDocumentViewSet

router = DefaultRouter()
router.register(r'public', PublicDocumentViewSet, basename='public-document')
router.register(r'', DocumentViewSet, basename='document')

urlpatterns = router.urls
