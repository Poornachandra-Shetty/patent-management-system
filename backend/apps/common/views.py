from django.db import connection
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status


class HealthCheckView(APIView):
    """
    Health check endpoint for cloud load balancers, orchestrators, and monitoring probes.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        db_status = "connected"
        http_code = status.HTTP_200_OK

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
        except Exception as exc:
            db_status = f"unhealthy: {str(exc)}"
            http_code = status.HTTP_503_SERVICE_UNAVAILABLE

        payload = {
            "status": "healthy" if http_code == status.HTTP_200_OK else "degraded",
            "service": "patent-management-system",
            "database": db_status,
            "timestamp": timezone.now().isoformat(),
        }

        return Response(payload, status=http_code)
