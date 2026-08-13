from rest_framework.routers import DefaultRouter
from apps.patents.views import PatentApplicationViewSet

router = DefaultRouter()
router.register(r'', PatentApplicationViewSet, basename='patent')

urlpatterns = router.urls
