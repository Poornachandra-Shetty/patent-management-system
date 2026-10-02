from typing import Any, cast

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.departments.models import Department
from apps.departments.serializers import DepartmentSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'usn_or_emp_id', 'email', 'mobile',
            'role', 'department', 'department_detail',
            'is_staff', 'is_superuser', 'created_at'
        ]
        read_only_fields = [
            'id', 'role', 'email', 'usn_or_emp_id', 'department',
            'is_staff', 'is_superuser', 'created_at'
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'usn_or_emp_id', 'email', 'mobile',
            'role', 'department', 'department_detail',
            'is_active', 'is_staff', 'is_superuser', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SJECTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        if not isinstance(email, str) or not email.endswith('@sjec.ac.in'):
            raise serializers.ValidationError({
                'email': 'Only email addresses ending with @sjec.ac.in may log in.'
            })

        data = cast(dict[str, Any], super().validate(attrs))
        data['user'] = UserSerializer(self.user).data
        return data


class EmailTokenObtainPairSerializer(SJECTokenObtainPairSerializer):
    pass


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    role = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'usn_or_emp_id', 'email', 'mobile', 'department', 'password', 'role'
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        if not isinstance(value, str) or not value.endswith('@sjec.ac.in'):
            raise serializers.ValidationError('Only email addresses ending with @sjec.ac.in may register.')
        return value

    def validate(self, attrs):
        attrs.pop('role', None)
        if not attrs.get('usn_or_emp_id'):
            raise serializers.ValidationError({'usn_or_emp_id': 'This field is required.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('role', None)
        user = User.objects.create_user(password=password, role='applicant', **validated_data)
        return user
