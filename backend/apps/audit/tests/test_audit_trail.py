"""
Audit Module Tests
==================
Tests for audit trail functionality.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.departments.models import Department
from apps.workflow.models import WorkflowEvent
from apps.reviews.models import Remark, RemarkAction

User = get_user_model()


class AuditTrailTestCase(TestCase):
    """Test cases for audit trail API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create department
        self.department = Department.objects.create(
            name="Computer Science",
            code="CS"
        )
        
        # Create users with different roles
        self.applicant_user = User.objects.create_user(
            email="applicant@test.com",
            name="John Applicant",
            usn_or_emp_id="APP001",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        self.scrutinizer_user = User.objects.create_user(
            email="scrutinizer@test.com",
            name="Jane Scrutinizer",
            usn_or_emp_id="SCR001",
            role='scrutinizer',
            password='testpass123',
            department=self.department
        )
        
        self.consultant_user = User.objects.create_user(
            email="consultant@test.com",
            name="Bob Consultant",
            usn_or_emp_id="CON001",
            role='consultant',
            password='testpass123',
            department=self.department
        )
        
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            name="Admin User",
            usn_or_emp_id="ADM001",
            role='admin',
            password='testpass123',
            department=self.department,
            is_staff=True
        )
        
        self.other_applicant_user = User.objects.create_user(
            email="otherapplicant@test.com",
            name="Other Applicant",
            usn_or_emp_id="APP002",
            role='applicant',
            password='testpass123',
            department=self.department
        )
        
        # Create patent application
        self.patent = PatentApplication.objects.create(
            patent_id="PATENT-2024-001",
            applicant=self.applicant_user,
            title="Test Patent",
            department=self.department,
            category="Software",
            abstract="Test abstract",
            keywords="test, patent",
            problem_statement="Test problem",
            novelty_description="Test novelty",
            proposed_application="Test application",
            status=PatentApplicationStatus.DRAFT
        )
    
    def test_authenticated_applicant_can_retrieve_own_audit_trail(self):
        """Test that an applicant can retrieve audit trail for their own patent."""
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['patent_id'], self.patent.patent_id)
        self.assertIn('audit_trail', response.data)
        self.assertEqual(response.data['total_entries'], 0)  # No entries yet
    
    def test_unauthenticated_user_cannot_access_audit_trail(self):
        """Test that unauthenticated users cannot access audit trails."""
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_unauthorized_applicant_cannot_access_other_patent(self):
        """Test that an applicant cannot access audit trail for another user's patent."""
        self.client.force_authenticate(user=self.other_applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_can_access_any_patent_audit(self):
        """Test that admin users can access audit trail for any patent."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['patent_id'], self.patent.patent_id)
    
    def test_status_changes_appear_in_audit_trail(self):
        """Test that WorkflowEvent status changes appear in the audit trail."""
        # Create a workflow event
        workflow_event = WorkflowEvent.objects.create(
            application=self.patent,
            performed_by=self.applicant_user,
            from_status=PatentApplicationStatus.DRAFT,
            to_status=PatentApplicationStatus.SUBMITTED,
            note="Submitted for review"
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_entries'], 1)
        
        audit_trail = response.data['audit_trail']
        self.assertEqual(len(audit_trail), 1)
        self.assertEqual(audit_trail[0]['entry_type'], 'status_change')
        self.assertEqual(audit_trail[0]['from_status'], PatentApplicationStatus.DRAFT)
        self.assertEqual(audit_trail[0]['to_status'], PatentApplicationStatus.SUBMITTED)
        self.assertEqual(audit_trail[0]['transition_note'], "Submitted for review")
        self.assertIsNotNone(audit_trail[0]['timestamp'])
    
    def test_remarks_appear_in_audit_trail(self):
        """Test that Remark entries appear in the audit trail."""
        # Create a remark
        remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="This patent looks good",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_entries'], 1)
        
        audit_trail = response.data['audit_trail']
        self.assertEqual(len(audit_trail), 1)
        self.assertEqual(audit_trail[0]['entry_type'], 'remark')
        self.assertEqual(audit_trail[0]['remark_text'], "This patent looks good")
        self.assertEqual(audit_trail[0]['remark_action'], RemarkAction.COMMENT)
        self.assertTrue(audit_trail[0]['visible_to_applicant'])
    
    def test_entries_returned_chronologically(self):
        """Test that audit entries are returned in chronological order (most recent first)."""
        # Create multiple entries
        workflow_event = WorkflowEvent.objects.create(
            application=self.patent,
            performed_by=self.applicant_user,
            from_status=PatentApplicationStatus.DRAFT,
            to_status=PatentApplicationStatus.SUBMITTED,
            note="First submission"
        )
        
        remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="First remark",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_entries'], 2)
        
        audit_trail = response.data['audit_trail']
        
        # Verify ordering: most recent first
        # Note: Since remark is created after workflow_event, it should come first
        if len(audit_trail) >= 2:
            # Both entries should be present
            entry_types = [entry['entry_type'] for entry in audit_trail]
            self.assertIn('status_change', entry_types)
            self.assertIn('remark', entry_types)
            
            # Verify timestamps are in descending order
            timestamps = [entry['timestamp'] for entry in audit_trail]
            for i in range(len(timestamps) - 1):
                self.assertGreaterEqual(timestamps[i], timestamps[i + 1])
    
    def test_applicant_cannot_see_internal_remarks(self):
        """Test that applicants cannot see remarks marked as invisible."""
        # Create internal (invisible) remark
        internal_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="Internal note - do not show to applicant",
            action=RemarkAction.COMMENT,
            visible_to_applicant=False
        )
        
        # Create visible remark
        visible_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="Public feedback",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see 1 remark (the visible one)
        self.assertEqual(response.data['total_entries'], 1)
        
        audit_trail = response.data['audit_trail']
        self.assertEqual(audit_trail[0]['remark_text'], "Public feedback")
    
    def test_scrutinizer_can_see_all_remarks(self):
        """Test that scrutinizers can see both visible and invisible remarks."""
        # Transition patent to SUBMITTED status so scrutinizer can view it
        # (Scrutinizers cannot view DRAFT patents per workflow permissions)
        self.patent.status = PatentApplicationStatus.SUBMITTED
        self.patent.save()
        
        # Create internal (invisible) remark
        internal_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="Internal note",
            action=RemarkAction.COMMENT,
            visible_to_applicant=False
        )
        
        # Create visible remark
        visible_remark = Remark.objects.create(
            application=self.patent,
            user=self.scrutinizer_user,
            text="Public feedback",
            action=RemarkAction.COMMENT,
            visible_to_applicant=True
        )
        
        self.client.force_authenticate(user=self.scrutinizer_user)
        response = self.client.get(f'/api/v1/audit/patents/{self.patent.patent_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see both remarks
        self.assertEqual(response.data['total_entries'], 2)
    
    def test_audit_list_endpoint_returns_auditable_patents(self):
        """Test that the audit list endpoint returns patents the user can audit."""
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get('/api/v1/audit/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'applicant')
        self.assertEqual(response.data['total'], 1)
        
        patents = response.data['auditable_patents']
        self.assertEqual(len(patents), 1)
        self.assertEqual(patents[0]['patent_id'], self.patent.patent_id)
    
    def test_audit_list_endpoint_filters_by_role(self):
        """Test that audit list endpoint respects role-based filtering."""
        # Applicants should only see their own patents
        self.client.force_authenticate(user=self.applicant_user)
        response = self.client.get('/api/v1/audit/')
        self.assertEqual(response.data['total'], 1)
        
        # Other applicants should see nothing
        self.client.force_authenticate(user=self.other_applicant_user)
        response = self.client.get('/api/v1/audit/')
        self.assertEqual(response.data['total'], 0)
        
        # Admin should see everything
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/audit/')
        self.assertEqual(response.data['total'], 1)
