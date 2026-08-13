from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.departments.serializers import DepartmentSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'usn_or_emp_id', 'email', 'mobile', 'role', 'department', 'department_detail', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'name', 'usn_or_emp_id', 'email', 'mobile', 'role', 'department', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
