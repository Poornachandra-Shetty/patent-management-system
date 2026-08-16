from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.departments.serializers import DepartmentSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'usn_or_emp_id', 'email', 'mobile', 'role', 'department', 'department_detail', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'name', 'usn_or_emp_id', 'email', 'mobile', 'department', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Public self-registration always creates applicant accounts.
        user = User.objects.create_user(password=password, role='applicant', **validated_data)
        return user
