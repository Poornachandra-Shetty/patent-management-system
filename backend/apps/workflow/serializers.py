from rest_framework import serializers

from apps.patents.models import PatentApplicationStatus
from apps.workflow.models import WorkflowEvent


class WorkflowEventSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(
        source='performed_by.name', read_only=True
    )
    patent_id = serializers.CharField(
        source='application.patent_id', read_only=True
    )

    class Meta:
        model = WorkflowEvent
        fields = [
            'id', 'patent_id', 'application',
            'performed_by', 'performed_by_name',
            'from_status', 'to_status',
            'note', 'created_at',
        ]
        read_only_fields = [
            'id', 'patent_id', 'application', 'performed_by',
            'from_status', 'to_status', 'created_at',
        ]


class TransitionRequestSerializer(serializers.Serializer):
    """Input serializer for POST /workflow/{patent_id}/transition/"""

    to_status = serializers.ChoiceField(
        choices=PatentApplicationStatus.choices,
        help_text='Target status to transition to.',
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Optional note explaining the transition.',
    )
    consultant_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='Required when to_status is forwarded_to_consultant.',
    )

    def validate(self, attrs):
        to_status = attrs['to_status']
        consultant_id = attrs.get('consultant_id')

        if to_status == PatentApplicationStatus.FORWARDED_TO_CONSULTANT and consultant_id is None:
            raise serializers.ValidationError({
                'consultant_id': 'This field is required when forwarding to a consultant.',
            })

        return attrs


class AllowedTransitionsSerializer(serializers.Serializer):
    patent_id = serializers.CharField()
    current_status = serializers.CharField()
    allowed_transitions = serializers.ListField(child=serializers.CharField())
    is_terminal = serializers.BooleanField()
