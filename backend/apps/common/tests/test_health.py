from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTestCase(APITestCase):
    def test_health_check_endpoint(self):
        response = self.client.get("/api/health/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertEqual(data["service"], "patent-management-system")
        self.assertIn("timestamp", data)
