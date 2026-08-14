from typing import TypedDict

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.departments.models import Department
from apps.patents.models import PatentApplication, PatentApplicationStatus, Inventor, PatentIDCounter
from apps.reviews.models import Remark, RemarkAction
from apps.workflow.models import WorkflowEvent

User = get_user_model()


class UserSeedData(TypedDict):
    email: str
    name: str
    usn_or_emp_id: str
    mobile: str
    role: str
    department: Department

class Command(BaseCommand):
    help = 'Seeds database with initial departments, demo users across roles, and sample patents'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding database with initial demo data...'))

        # 1. Create Departments
        departments_data = [
            {'name': 'Computer Science & Engineering', 'code': 'CSE'},
            {'name': 'Electronics & Communication Engineering', 'code': 'ECE'},
            {'name': 'Mechanical Engineering', 'code': 'MECH'},
            {'name': 'Civil Engineering', 'code': 'CIVIL'},
            {'name': 'Biotechnology', 'code': 'BIOTECH'},
        ]

        departments = {}
        for dept_info in departments_data:
            dept, created = Department.objects.get_or_create(
                code=dept_info['code'],
                defaults={'name': dept_info['name']}
            )
            departments[dept.code] = dept

        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} departments.'))

        # 2. Create Users
        users_data: list[UserSeedData] = [
            {
                'email': 'admin@college.edu',
                'name': 'Dr. Administrative Head',
                'usn_or_emp_id': 'EMP001',
                'mobile': '9876543210',
                'role': 'admin',
                'department': departments['CSE'],
            },
            {
                'email': 'scrutinizer@college.edu',
                'name': 'Dr. Scrutinizer Specialist',
                'usn_or_emp_id': 'EMP002',
                'mobile': '9876543211',
                'role': 'scrutinizer',
                'department': departments['CSE'],
            },
            {
                'email': 'consultant@college.edu',
                'name': 'Advocate External Consultant',
                'usn_or_emp_id': 'EMP003',
                'mobile': '9876543212',
                'role': 'consultant',
                'department': departments['ECE'],
            },
            {
                'email': 'student@college.edu',
                'name': 'Ananya Student',
                'usn_or_emp_id': 'USN2026001',
                'mobile': '9876543213',
                'role': 'applicant',
                'department': departments['CSE'],
            },
            {
                'email': 'faculty@college.edu',
                'name': 'Prof. Mechanical Lead',
                'usn_or_emp_id': 'EMP101',
                'mobile': '9876543214',
                'role': 'applicant',
                'department': departments['MECH'],
            },
        ]

        users = {}
        for u_info in users_data:
            user, created = User.objects.get_or_create(
                email=u_info['email'],
                defaults={
                    'name': u_info['name'],
                    'usn_or_emp_id': u_info['usn_or_emp_id'],
                    'mobile': u_info['mobile'],
                    'role': u_info['role'],
                    'department': u_info['department'],
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            users[u_info['role'] + '_' + u_info['usn_or_emp_id']] = user

        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} demo users (Password: password123).'))

        # 3. Create Sample Patents
        patents_data = [
            {
                'patent_id': 'PAT-2026-CSE-001',
                'applicant': users['applicant_USN2026001'],
                'department': departments['CSE'],
                'title': 'AI-Driven Autonomous Crop Health Monitoring Drone System',
                'category': 'Artificial Intelligence & Robotics',
                'abstract': 'A system and method for autonomous multi-spectral drone surveillance to detect early-stage crop diseases using deep neural networks.',
                'keywords': 'AI, Drone, Computer Vision, Agriculture, Precision Farming',
                'problem_statement': 'Traditional manual field inspections are labor-intensive, error-prone, and delay disease intervention.',
                'novelty_description': 'Novel lightweight edge-computing neural network running directly on onboard drone microcontrollers.',
                'proposed_application': 'Automated agricultural monitoring and early pest warning systems.',
                'status': PatentApplicationStatus.SUBMITTED,
            },
            {
                'patent_id': 'PAT-2026-ECE-001',
                'applicant': users['applicant_USN2026001'],
                'assigned_to': users['consultant_EMP003'],
                'department': departments['ECE'],
                'title': 'Ultra Low-Power Mesh Gateway for Smart Grid Energy Monitoring',
                'category': 'Internet of Things (IoT)',
                'abstract': 'An energy-harvesting wireless mesh gateway capable of operating indefinitely on ambient solar and thermal energy.',
                'keywords': 'IoT, Smart Grid, Energy Harvesting, Wireless Mesh',
                'problem_statement': 'Remote grid sensors require frequent battery replacements causing downtime.',
                'novelty_description': 'Integrated dual-harvesting thermoelectric and photovoltaic micro-controller power manager.',
                'proposed_application': 'Smart cities, power utilities, and rural electrification monitoring.',
                'status': PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
            },
            {
                'patent_id': 'PAT-2026-MECH-001',
                'applicant': users['applicant_EMP101'],
                'department': departments['MECH'],
                'title': 'Variable-Geometry Regenerative Braking Mechanism for Electric Vehicles',
                'category': 'Automotive & Mechanical Systems',
                'abstract': 'A mechanical kinetic energy recovery system utilizing variable ratio magnetic gearing to maximize braking energy recovery.',
                'keywords': 'EV, Regenerative Braking, Magnetic Gear, Energy Efficiency',
                'problem_statement': 'Standard EV regenerative brakes lose efficiency during low-speed stopping.',
                'novelty_description': 'Magnetic gear shift mechanism providing dynamic torque adjustment without mechanical friction.',
                'proposed_application': 'Electric commercial vehicles and hybrid transit buses.',
                'status': PatentApplicationStatus.APPROVED,
            },
        ]

        for p_info in patents_data:
            patent, created = PatentApplication.objects.get_or_create(
                patent_id=p_info['patent_id'],
                defaults=p_info
            )
            if created:
                Inventor.objects.create(
                    application=patent,
                    name=patent.applicant.name,
                    usn_or_emp_id=patent.applicant.usn_or_emp_id,
                    department=patent.department,
                    is_primary_inventor=True
                )
                PatentIDCounter.objects.update_or_create(
                    department=patent.department,
                    year=2026,
                    defaults={'last_sequence': 1},
                )
                if patent.status == PatentApplicationStatus.SUBMITTED:
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=patent.applicant,
                        from_status=PatentApplicationStatus.DRAFT,
                        to_status=PatentApplicationStatus.SUBMITTED,
                        note='Application submitted by applicant.',
                    )
                elif patent.status == PatentApplicationStatus.FORWARDED_TO_CONSULTANT:
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=patent.applicant,
                        from_status=PatentApplicationStatus.DRAFT,
                        to_status=PatentApplicationStatus.SUBMITTED,
                        note='Application submitted by applicant.',
                    )
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=users['scrutinizer_EMP002'],
                        from_status=PatentApplicationStatus.SUBMITTED,
                        to_status=PatentApplicationStatus.UNDER_SCRUTINY,
                        note='Moved to scrutiny queue.',
                    )
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=users['scrutinizer_EMP002'],
                        from_status=PatentApplicationStatus.UNDER_SCRUTINY,
                        to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
                        note='Forwarded to external consultant.',
                    )
                    Remark.objects.create(
                        application=patent,
                        user=users['scrutinizer_EMP002'],
                        text='Prior art search completed. Novelty confirmed. Forwarding to external consultant for patentability evaluation.',
                        action=RemarkAction.FORWARDED,
                        visible_to_applicant=True
                    )
                elif patent.status == PatentApplicationStatus.APPROVED:
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=patent.applicant,
                        from_status=PatentApplicationStatus.DRAFT,
                        to_status=PatentApplicationStatus.SUBMITTED,
                        note='Application submitted by applicant.',
                    )
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=users['scrutinizer_EMP002'],
                        from_status=PatentApplicationStatus.SUBMITTED,
                        to_status=PatentApplicationStatus.UNDER_SCRUTINY,
                        note='Moved to scrutiny queue.',
                    )
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=users['scrutinizer_EMP002'],
                        from_status=PatentApplicationStatus.UNDER_SCRUTINY,
                        to_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
                        note='Forwarded to external consultant.',
                    )
                    WorkflowEvent.objects.create(
                        application=patent,
                        performed_by=users['consultant_EMP003'],
                        from_status=PatentApplicationStatus.FORWARDED_TO_CONSULTANT,
                        to_status=PatentApplicationStatus.APPROVED,
                        note='Approved for IPO filing.',
                    )
                    Remark.objects.create(
                        application=patent,
                        user=users['consultant_EMP003'],
                        text='Comprehensive novelty check passed. Specifications ready for Indian Patent Office (IPO) filing.',
                        action=RemarkAction.APPROVED,
                        visible_to_applicant=True
                    )

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
