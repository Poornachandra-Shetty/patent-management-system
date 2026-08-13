from rest_framework import serializers
from apps.reviews.models import Remark
from apps.authentication.serializers import UserSerializer

class RemarkSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Remark
        fields = ['id', 'application', 'user', 'user_detail', 'text', 'action', 'visible_to_applicant', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
