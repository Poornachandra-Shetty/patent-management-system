import pytest
from django.contrib.auth import get_user_model

from apps.departments.models import Department
from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.workflow.exceptions import (
    ConsultantRequiredError,
    PatentAccessDeniedError,
    TerminalStateError,
    TransitionNotAllowedError,
)
from apps.workflow.models import WorkflowEvent
from apps.workflow.services import transition_patent
from apps.workflow.state_machine import can_transition, get_allowed_transitions

User = get_user_model()


@pytest.fixture
def department(db):
    return Department.objects.create(name='Computer Science & Engineering', code='CSE')


@pytest.fixture
def applicant(db, department):
    return User.objects.create_user(
        email='applicant@test.edu',
        password='pass1234',
        name='Test Applicant',
        usn_or_emp_id='USN9001',
        mobile='9000000001',
        role='applicant',
        department=department,
    )


@pytest.fixture
def other_applicant(db, department):
    return User.objects.create_user(
        email='other@test.edu',
        password='pass1234',
        name='Other Applicant',
        usn_or_emp_id='USN9002',
        mobile='9000000002',
        role='applicant',
        department=department,
    )


@pytest.fixture
def scrutinizer(db, department):
    return User.objects.create_user(
        email='scrutinizer@test.edu',
        password='pass1234',
        name='Test Scrutinizer',
        usn_or_emp_id='EMP9001',
        mobile='9000000003',
        role='scrutinizer',
        department=department,
    )


@pytest.fixture
def consultant(db, department):
    return User.objects.create_user(
        email='consultant@test.edu',
        password='pass1234',
        name='Test Consultant',
        usn_or_emp_id='EMP9002',
        mobile='9000000004',
        role='consultant',
        department=department,
    )


@pytest.fixture
def draft_patent(db, applicant, department):
    return PatentApplication.objects.create(
        patent_id='PAT-2026-CSE-900',
        applicant=applicant,
        department=department,
        title='Test Patent',
        category='Software',
        abstract='Abstract',
        keywords='test',
        problem_statement='Problem',
        novelty_description='Novelty',
        proposed_application='Application',
        status=PatentApplicationStatus.DRAFT,
    )


@pytest.fixture
def submitted_patent(db, applicant, department):
    return PatentApplication.objects.create(
        patent_id='PAT-2026-CSE-901',
        applicant=applicant,
        department=department,
        title='Submitted Patent',
        category='Software',
        abstract='Abstract',
        keywords='test',
        problem_statement='Problem',
        novelty_description='Novelty',
        proposed_application='Application',
        status=PatentApplicationStatus.SUBMITTED,
    )
