from django.db import models, transaction
from datetime import datetime

class PatentIDCounter(models.Model):
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='id_counters')
    year = models.IntegerField()
    last_sequence = models.IntegerField(default=0)

    class Meta:
        unique_together = ('department', 'year')

    def __str__(self):
        return f"{self.department.code}-{self.year}: {self.last_sequence}"


def generate_patent_id(department):
    """
    Generates a unique atomic Patent ID like PAT-2026-CSE-001.
    Uses select_for_update() to prevent race conditions during concurrent submissions.
    """
    current_year = datetime.now().year
    with transaction.atomic():
        counter, created = PatentIDCounter.objects.select_for_update().get_or_create(
            department=department,
            year=current_year,
            defaults={'last_sequence': 0}
        )
        counter.last_sequence += 1
        counter.save()
        
        sequence_str = str(counter.last_sequence).zfill(3)
        return f"PAT-{current_year}-{department.code.upper()}-{sequence_str}"
