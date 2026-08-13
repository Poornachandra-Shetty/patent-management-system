from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from apps.authentication.managers import UserManager
from apps.departments.models import Department

class UserRole(models.TextChoices):
    APPLICANT = 'applicant', 'Applicant'
    SCRUTINIZER = 'scrutinizer', 'Scrutinizer'
    CONSULTANT = 'consultant', 'Consultant'
    ADMIN = 'admin', 'Admin'

class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=150)
    usn_or_emp_id = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=15)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.APPLICANT)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'usn_or_emp_id']

    def __str__(self):
        return f"{self.name} ({self.usn_or_emp_id}) - {self.role}"
