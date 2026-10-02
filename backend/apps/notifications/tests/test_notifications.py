"""
Notification Tests
==================
Tests for notifications module.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.notifications.models import Notification, NotificationEventType
from apps.notifications.services import create_status_change_notification, create_remark_notification
from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.reviews.models import Remark, RemarkAction
from apps.departments.models import Department
from apps.workflow.models import WorkflowEvent

User = get_user_model()


class NotificationModelTestCase(TestCase):
    """Test cases for the Notification model."""
    
    def setUp(self):
        """Set up test data."""
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        self.user = User.objects.create_user(
            email="test@test.com",
            name="Test User",
            usn_or_emp_id="USR001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-TEST-001",
            applicant=self.user,
            title="Test Patent",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.DRAFT
        )
    
    def test_notification_creation(self):
        """Test creating a notification."""
        notification = Notification.objects.create(
            recipient=self.user,
            title="Test Title",
            message="Test Message",
            event_type=NotificationEventType.STATUS_CHANGE,
            related_application=self.patent,
        )
        
        self.assertIsNotNone(notification.id)
        self.assertEqual(notification.recipient, self.user)
        self.assertFalse(notification.is_read)
    
    def test_mark_as_read(self):
        """Test marking notification as read."""
        notification = Notification.objects.create(
            recipient=self.user,
            title="Test Title",
            message="Test Message",
            event_type=NotificationEventType.STATUS_CHANGE,
            related_application=self.patent,
        )
        
        self.assertFalse(notification.is_read)
        notification.mark_as_read()
        self.assertTrue(notification.is_read)
        
        # Verify it was saved
        refreshed = Notification.objects.get(pk=notification.pk)
        self.assertTrue(refreshed.is_read)


class NotificationServiceTestCase(TestCase):
    """Test cases for notification service functions."""
    
    def setUp(self):
        """Set up test data."""
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        self.applicant = User.objects.create_user(
            email="applicant@test.com",
            name="Applicant",
            usn_or_emp_id="APP001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.scrutinizer = User.objects.create_user(
            email="scrutinizer@test.com",
            name="Scrutinizer",
            usn_or_emp_id="SCR001",
            role='scrutinizer',
            password='testpass123',
            department=self.department
        )
        
        self.consultant = User.objects.create_user(
            email="consultant@test.com",
            name="Consultant",
            usn_or_emp_id="CON001",
            role='consultant',
            password='testpass123',
            department=self.department
        )
        
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-SVC-001",
            applicant=self.applicant,
            title="Service Test Patent",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.DRAFT
        )
    
    def test_create_status_change_notification_notifies_applicant(self):
        """Test that status change notifies the applicant."""
        notifications = create_status_change_notification(
            patent=self.patent,
            from_status=PatentApplicationStatus.DRAFT,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=self.applicant,
        )
        
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].recipient, self.applicant)
        self.assertEqual(notifications[0].event_type, NotificationEventType.STATUS_CHANGE)
        self.assertIn('Status Changed', notifications[0].title)
    
    def test_create_status_change_notification_notifies_consultant(self):
        """Test that status change to FORWARDED_TO_CONSULTANT notifies the consultant."""
        self.patent.assigned_to = self.consultant
        self.patent.save()
        
        notifications = create_status_change_notification(
            patent=self.patent,
            from_status=PatentApplicationStatus.UNDER_SCRUTINY,
            to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
            performed_by=self.scrutinizer,
        )
        
        # Should notify both applicant and consultant
        self.assertEqual(len(notifications), 2)
        recipients = [n.recipient for n in notifications]
        self.assertIn(self.applicant, recipients)
        self.assertIn(self.consultant, recipients)
    
    def test_create_remark_notification_visible_to_applicant(self):
        """Test that visible remarks notify the applicant."""
        remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer,
            text="Test remark",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        notification = create_remark_notification(remark=remark)
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.recipient, self.applicant)
        self.assertEqual(notification.event_type, NotificationEventType.REMARK_ADDED)
    
    def test_create_remark_notification_internal_remark(self):
        """Test that internal remarks don't notify the applicant."""
        # For internal remarks, we notify the assigned consultant if exists
        self.patent.assigned_to = self.consultant
        self.patent.save()
        
        remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer,
            text="Internal note",
            action=RemarkAction.COMMENT,
            visible_to_applicant=False
        )
        
        notification = create_remark_notification(remark=remark)
        
        # Should notify the assigned consultant for internal remarks
        if notification:
            self.assertEqual(notification.recipient, self.consultant)


class NotificationAPITestCase(TestCase):
    """Test cases for Notification API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        self.user1 = User.objects.create_user(
            email="user1@test.com",
            name="User One",
            usn_or_emp_id="USR001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.user2 = User.objects.create_user(
            email="user2@test.com",
            name="User Two",
            usn_or_emp_id="USR002",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-API-001",
            applicant=self.user1,
            title="API Test Patent",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.DRAFT
        )
        
        # Create some notifications
        self.notification1 = Notification.objects.create(
            recipient=self.user1,
            title="Notification 1",
            message="Message 1",
            event_type=NotificationEventType.STATUS_CHANGE,
            related_application=self.patent,
            is_read=False
        )
        
        self.notification2 = Notification.objects.create(
            recipient=self.user1,
            title="Notification 2",
            message="Message 2",
            event_type=NotificationEventType.REMARK_ADDED,
            related_application=self.patent,
            is_read=True
        )
        
        self.notification3 = Notification.objects.create(
            recipient=self.user2,
            title="Notification 3",
            message="Message 3",
            event_type=NotificationEventType.STATUS_CHANGE,
            related_application=self.patent,
            is_read=False
        )
    
    def test_unauthenticated_user_cannot_list_notifications(self):
        """Test that unauthenticated users cannot access notifications."""
        response = self.client.get('/api/v1/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_user_can_list_own_notifications(self):
        """Test that authenticated users can list their own notifications."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_user_cannot_see_other_users_notifications(self):
        """Test that users cannot see other users' notifications."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/notifications/')
        
        notification_ids = [n['id'] for n in response.data['results']]
        self.assertNotIn(self.notification3.id, notification_ids)
    
    def test_user_can_mark_own_notification_as_read(self):
        """Test that a user can mark their own notification as read."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(
            f'/api/v1/notifications/{self.notification1.id}/mark-as-read/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])
        
        # Verify in database
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
    
    def test_user_cannot_mark_other_notification_as_read(self):
        """Test that a user cannot mark other users' notifications as read."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(
            f'/api/v1/notifications/{self.notification3.id}/mark-as-read/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify it wasn't changed
        self.notification3.refresh_from_db()
        self.assertFalse(self.notification3.is_read)
    
    def test_user_can_retrieve_specific_notification(self):
        """Test that a user can retrieve a specific notification."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/notifications/{self.notification1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.notification1.id)
        self.assertEqual(response.data['title'], 'Notification 1')
    
    def test_notification_contains_patent_relationship(self):
        """Test that notification contains related patent information."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/notifications/{self.notification1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['related_application'])
        self.assertEqual(response.data['related_application_detail']['patent_id'], self.patent.patent_id)
    
    def test_notifications_ordered_newest_first(self):
        """Test that notifications are ordered by newest first."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notifications = response.data['results']
        
        # Verify ordering by checking created_at times
        if len(notifications) > 1:
            for i in range(len(notifications) - 1):
                self.assertGreaterEqual(
                    notifications[i]['created_at'],
                    notifications[i + 1]['created_at']
                )
    
    def test_mark_all_as_read(self):
        """Test marking all notifications as read."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch('/api/v1/notifications/mark-all-as-read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all user's notifications are read
        unread = Notification.objects.filter(recipient=self.user1, is_read=False)
        self.assertEqual(unread.count(), 0)
    
    def test_unread_count(self):
        """Test getting unread notification count."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/notifications/unread-count/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)  # Only notification1 is unread


class NotificationWorkflowIntegrationTestCase(TestCase):
    """Test cases for notification creation during workflow transitions."""
    
    def setUp(self):
        """Set up test data."""
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        self.applicant = User.objects.create_user(
            email="applicant@test.com",
            name="Applicant",
            usn_or_emp_id="APP001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-WF-001",
            applicant=self.applicant,
            title="Workflow Integration Test",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.DRAFT
        )
    
    def test_status_change_creates_notification(self):
        """Test that status change creates a notification."""
        initial_count = Notification.objects.filter(recipient=self.applicant).count()
        
        # Create a status change via WorkflowEvent
        create_status_change_notification(
            patent=self.patent,
            from_status=PatentApplicationStatus.DRAFT,
            to_status=PatentApplicationStatus.SUBMITTED,
            performed_by=self.applicant,
        )
        
        final_count = Notification.objects.filter(recipient=self.applicant).count()
        self.assertEqual(final_count, initial_count + 1)
        
        # Verify notification content
        notification = Notification.objects.filter(recipient=self.applicant).latest('created_at')
        self.assertEqual(notification.event_type, NotificationEventType.STATUS_CHANGE)
        self.assertIn('Status Changed', notification.title)


class NotificationRemarkIntegrationTestCase(TestCase):
    """Test cases for notification creation when remarks are added."""
    
    def setUp(self):
        """Set up test data."""
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        self.applicant = User.objects.create_user(
            email="applicant@test.com",
            name="Applicant",
            usn_or_emp_id="APP001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.scrutinizer = User.objects.create_user(
            email="scrutinizer@test.com",
            name="Scrutinizer",
            usn_or_emp_id="SCR001",
            role='scrutinizer',
            password='testpass123',
            department=self.department
        )
        
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-RM-001",
            applicant=self.applicant,
            title="Remark Integration Test",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.SUBMITTED
        )
    
    def test_visible_remark_creates_notification(self):
        """Test that a visible remark creates a notification for the applicant."""
        initial_count = Notification.objects.filter(recipient=self.applicant).count()
        
        remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer,
            text="Test remark",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        create_remark_notification(remark=remark)
        
        final_count = Notification.objects.filter(recipient=self.applicant).count()
        self.assertEqual(final_count, initial_count + 1)
        
        # Verify notification content
        notification = Notification.objects.filter(recipient=self.applicant).latest('created_at')
        self.assertEqual(notification.event_type, NotificationEventType.REMARK_ADDED)
        self.assertIn('remark', notification.title.lower())
