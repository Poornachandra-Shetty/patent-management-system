from rest_framework import serializers
from apps.patents.models import PatentApplication, Inventor, PatentApplicationStatus
from apps.patents.id_generator import generate_patent_id
from apps.departments.serializers import DepartmentSerializer
from apps.authentication.serializers import UserSerializer

class InventorSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Inventor
        fields = ['id', 'name', 'usn_or_emp_id', 'department', 'department_detail', 'is_primary_inventor']


class PatentApplicationListSerializer(serializers.ModelSerializer):
    applicant_detail = UserSerializer(source='applicant', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = PatentApplication
        fields = [
            'id', 'patent_id', 'applicant', 'applicant_detail', 'title',
            'department', 'department_detail', 'category', 'status', 'created_at', 'updated_at'
        ]


class PatentApplicationDetailSerializer(serializers.ModelSerializer):
    applicant_detail = UserSerializer(source='applicant', read_only=True)
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)
    inventors = InventorSerializer(many=True, read_only=True)

    class Meta:
        model = PatentApplication
        fields = [
            'id', 'patent_id', 'applicant', 'applicant_detail', 'assigned_to', 'assigned_to_detail',
            'title', 'department', 'department_detail', 'category', 'abstract', 'keywords',
            'problem_statement', 'novelty_description', 'proposed_application',
            'status', 'inventors', 'created_at', 'updated_at'
        ]


class PatentApplicationCreateSerializer(serializers.ModelSerializer):
    inventors = InventorSerializer(many=True, required=False)

    class Meta:
        model = PatentApplication
        fields = [
            'id', 'patent_id', 'title', 'department', 'category', 'abstract',
            'keywords', 'problem_statement', 'novelty_description',
            'proposed_application', 'inventors'
        ]
        read_only_fields = ['id', 'patent_id']

    def create(self, validated_data):
        inventors_data = validated_data.pop('inventors', [])
        user = self.context['request'].user
        department = validated_data['department']
        
        # Auto generate patent_id
        patent_id = generate_patent_id(department)
        
        patent = PatentApplication.objects.create(
            patent_id=patent_id,
            applicant=user,
            **validated_data
        )

        for inv_data in inventors_data:
            Inventor.objects.create(application=patent, **inv_data)

        return patent
