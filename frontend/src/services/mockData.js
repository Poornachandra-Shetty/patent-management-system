/**
 * Mock Data for Testing
 * Used when backend API is not available
 */

// Mock User
export const MOCK_USER = {
  id: 1,
  name: 'Test Applicant',
  email: 'testapplicant@sjec.ac.in',
  role: 'applicant',
  department: 'Computer Science & Engineering',
  usn_or_emp_id: 'EMP001',
}

// Mock Patents
export const MOCK_PATENTS = [
  {
    id: 1,
    patent_id: 'PAT-2026-CSE-001',
    title: 'AI-Based Traffic Management System',
    inventor_details: 'Dr. John Doe, Jane Smith (Student)',
    department: 'Computer Science & Engineering',
    category: 'Computer Science',
    abstract: 'An intelligent traffic management system that uses machine learning algorithms to optimize traffic flow and reduce congestion in urban areas. The system analyzes real-time traffic data and dynamically adjusts signal timing.',
    keywords: 'artificial intelligence, traffic management, machine learning, smart city',
    problem_statement: 'Urban traffic congestion causes significant delays, increased fuel consumption, and environmental pollution. Traditional traffic management systems use fixed signal timing that cannot adapt to changing traffic patterns.',
    novelty_description: 'Our system uses a novel deep learning algorithm that predicts traffic patterns 15 minutes ahead and proactively adjusts signals. The algorithm learns from historical data and adapts to special events, weather conditions, and emergency situations.',
    proposed_application: 'Can be deployed in smart cities, industrial campuses, shopping malls, and airports. The system can integrate with existing traffic infrastructure and provide real-time analytics to city planners.',
    status: 'draft',
    created_at: '2026-01-10T10:30:00Z',
    updated_at: '2026-01-12T14:20:00Z',
  },
  {
    id: 2,
    patent_id: 'PAT-2026-MECH-002',
    title: 'Energy-Efficient HVAC Control System',
    inventor_details: 'Prof. Michael Brown, Alex Johnson (Student)',
    department: 'Mechanical Engineering',
    category: 'Mechanical',
    abstract: 'A novel HVAC control system that optimizes energy consumption while maintaining comfortable indoor environments. Uses IoT sensors and predictive algorithms.',
    keywords: 'HVAC, energy efficiency, IoT, automation',
    problem_statement: 'Traditional HVAC systems operate on fixed schedules, leading to energy waste when spaces are unoccupied or when weather conditions change.',
    novelty_description: 'Our system uses occupancy prediction based on calendar data and historical patterns, combined with weather forecasts, to pre-condition spaces efficiently.',
    proposed_application: 'Commercial buildings, hospitals, educational institutions, and residential complexes.',
    status: 'submitted',
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-08T11:45:00Z',
  },
  {
    id: 3,
    patent_id: 'PAT-2025-ECE-015',
    title: 'Low-Power Wearable Health Monitor',
    inventor_details: 'Dr. Sarah Williams, Raj Kumar (Student), Priya Sharma (Student)',
    department: 'Electronics & Communication Engineering',
    category: 'Electronics',
    abstract: 'A compact wearable device that monitors vital health parameters including heart rate, blood oxygen, and temperature with minimal power consumption.',
    keywords: 'wearable, health monitoring, low-power, IoT',
    problem_statement: 'Existing wearable health monitors have limited battery life and require frequent charging, reducing user compliance.',
    novelty_description: 'Our design uses novel power management techniques including energy harvesting and adaptive sampling to extend battery life to 30 days.',
    proposed_application: 'Healthcare monitoring, elderly care, fitness tracking, and clinical trials.',
    status: 'under_scrutiny',
    created_at: '2025-12-15T14:30:00Z',
    updated_at: '2026-01-10T09:15:00Z',
  },
]

// Mock Documents
export const MOCK_DOCUMENTS = [
  {
    id: 1,
    application_id: 1,
    doc_type: 'patent_form',
    file_url: '/documents/patent_form_001.pdf',
    uploaded_at: '2026-01-11T10:00:00Z',
  },
  {
    id: 2,
    application_id: 1,
    doc_type: 'supporting_documents',
    file_url: '/documents/supporting_001.pdf',
    uploaded_at: '2026-01-11T10:05:00Z',
  },
  {
    id: 3,
    application_id: 2,
    doc_type: 'patent_form',
    file_url: '/documents/patent_form_002.pdf',
    uploaded_at: '2026-01-06T15:30:00Z',
  },
  {
    id: 4,
    application_id: 2,
    doc_type: 'nda',
    file_url: '/documents/nda_002.pdf',
    uploaded_at: '2026-01-06T15:35:00Z',
  },
]

// Mock Remarks
export const MOCK_REMARKS = [
  {
    id: 1,
    application_id: 2,
    user_id: 10,
    user_name: 'Dr. Scrutinizer',
    text: 'Please provide more details about the machine learning algorithms used. Include specifics about the training data and accuracy metrics.',
    created_at: '2026-01-07T11:00:00Z',
  },
  {
    id: 2,
    application_id: 2,
    user_id: 10,
    user_name: 'Dr. Scrutinizer',
    text: 'Thank you for the additional information. The application has been forwarded to the consultant for technical review.',
    created_at: '2026-01-09T14:30:00Z',
  },
  {
    id: 3,
    application_id: 3,
    user_id: 11,
    user_name: 'Consultant Review',
    text: 'The technical specifications look good. Please ensure all safety certifications are documented before final approval.',
    created_at: '2026-01-10T16:00:00Z',
  },
]

// Mock Stats
export const MOCK_STATS = {
  total: 3,
  drafts: 1,
  under_review: 2,
  approved: 0,
}

// Check if we should use mock data
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true

// Helper to simulate API delay
export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))
