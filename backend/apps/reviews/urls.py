from rest_framework.routers import DefaultRouter
from apps.reviews.views import RemarkViewSet

router = DefaultRouter()
router.register(r'', RemarkViewSet, basename='remark')

urlpatterns = router.urls
