"""
Audit Log Serializers
=====================
Serializers for audit trail data combining WorkflowEvent (status changes) and Remark entries.
"""

from rest_framework import serializers
from apps.workflow.models import WorkflowEvent
from apps.reviews.models import Remark
from apps.authentication.serializers import UserSerializer


class AuditEntrySerializer(serializers.Serializer):
    """
    Polymorphic serializer for audit trail entries.
    Handles both WorkflowEvent (status_change) and Remark entries.
    """
    entry_id = serializers.IntegerField(help_text="Unique ID of the audit entry")
    entry_type = serializers.CharField(
        help_text="Type of audit entry: 'status_change' or 'remark'"
    )
    timestamp = serializers.DateTimeField(
        help_text="When the event occurred"
    )
    actor = serializers.DictField(
        child=serializers.CharField(),
        help_text="User who created the entry (id, name, email)"
    )
    actor_role = serializers.CharField(
        help_text="Role of the user who created the entry"
    )

    # Status change specific fields
    from_status = serializers.CharField(
        required=False, allow_null=True,
        help_text="Previous status (for status_change entries)"
    )
    to_status = serializers.CharField(
        required=False, allow_null=True,
        help_text="New status (for status_change entries)"
    )
    transition_note = serializers.CharField(
        required=False, allow_null=True,
        help_text="Optional note explaining status change"
    )

    # Remark specific fields
    remark_text = serializers.CharField(
        required=False, allow_null=True,
        help_text="Content of the remark"
    )
    remark_action = serializers.CharField(
        required=False, allow_null=True,
        help_text="Action associated with remark (approved, rejected, forwarded, comment)"
    )
    visible_to_applicant = serializers.BooleanField(
        required=False,
        help_text="Whether remark is visible to patent applicant"
    )


class WorkflowEventDetailSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowEvent model with user details."""
    performed_by_detail = UserSerializer(source='performed_by', read_only=True)
    patent_id = serializers.CharField(source='application.patent_id', read_only=True)

    class Meta:
        model = WorkflowEvent
        fields = [
            'id', 'patent_id', 'performed_by', 'performed_by_detail',
            'from_status', 'to_status', 'note', 'created_at'
        ]
        read_only_fields = fields


class RemarkDetailSerializer(serializers.ModelSerializer):
    """Serializer for Remark model with user details."""
    user_detail = UserSerializer(source='user', read_only=True)
    patent_id = serializers.CharField(source='application.patent_id', read_only=True)

    class Meta:
        model = Remark
        fields = [
            'id', 'patent_id', 'user', 'user_detail', 'text', 'action',
            'visible_to_applicant', 'created_at'
        ]
        read_only_fields = fields
