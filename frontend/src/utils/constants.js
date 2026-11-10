// Application Constants

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  PATENTS: '/patents/',
  PATENT_DETAIL: (id) => `/patents/${id}/`,
  PATENT_SUBMIT: (id) => `/patents/${id}/submit/`,
  DOCUMENTS: '/documents/',
  REVIEWS: '/reviews/',
}

// Patent Status Values
export const PATENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_CONSULTANT_REVIEW: 'under_consultant_review',
  UNDER_REVIEW_TEAM: 'under_review_team',
  PENDING_FINAL_APPROVAL: 'pending_final_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  // Legacy aliases
  UNDER_SCRUTINY: 'under_scrutiny',
  FORWARDED_TO_CONSULTANT: 'forwarded_to_consultant',
}

// Status Display Labels
export const STATUS_LABELS = {
  [PATENT_STATUS.DRAFT]: 'Draft',
  [PATENT_STATUS.SUBMITTED]: 'Submitted',
  [PATENT_STATUS.UNDER_CONSULTANT_REVIEW]: 'Under Consultant Review',
  [PATENT_STATUS.UNDER_REVIEW_TEAM]: 'Under Review Team',
  [PATENT_STATUS.PENDING_FINAL_APPROVAL]: 'Pending Final Approval',
  [PATENT_STATUS.APPROVED]: 'Approved',
  [PATENT_STATUS.REJECTED]: 'Rejected',
  // Legacy
  [PATENT_STATUS.UNDER_SCRUTINY]: 'Under Scrutiny (Legacy)',
  [PATENT_STATUS.FORWARDED_TO_CONSULTANT]: 'Forwarded to Consultant (Legacy)',
}

// Status Colors (for styling)
export const STATUS_COLORS = {
  [PATENT_STATUS.DRAFT]: '#6b7280', // gray
  [PATENT_STATUS.SUBMITTED]: '#3b82f6', // blue
  [PATENT_STATUS.UNDER_CONSULTANT_REVIEW]: '#8b5cf6', // purple
  [PATENT_STATUS.UNDER_REVIEW_TEAM]: '#f59e0b', // amber
  [PATENT_STATUS.PENDING_FINAL_APPROVAL]: '#06b6d4', // cyan
  [PATENT_STATUS.APPROVED]: '#10b981', // green
  [PATENT_STATUS.REJECTED]: '#ef4444', // red
  // Legacy
  [PATENT_STATUS.UNDER_SCRUTINY]: '#f59e0b',
  [PATENT_STATUS.FORWARDED_TO_CONSULTANT]: '#8b5cf6',
}

// Document Types
export const DOCUMENT_TYPES = {
  APPLICANT_PATENT_REPORT: 'applicant_patent_report',
  CONSULTANT_EVALUATION_REPORT: 'consultant_evaluation_report',
  INTERNAL_REVIEW_REPORT: 'internal_review_report',
  SUPPORTING_DOCUMENTS: 'supporting_documents',
  PATENT_FORM: 'patent_form',
  NDA: 'nda',
}

// Document Type Labels
export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.APPLICANT_PATENT_REPORT]: 'Applicant Patent Report (Mandatory PDF)',
  [DOCUMENT_TYPES.CONSULTANT_EVALUATION_REPORT]: 'Consultant Evaluation Report (PDF)',
  [DOCUMENT_TYPES.INTERNAL_REVIEW_REPORT]: 'Internal Review Team Report (PDF)',
  [DOCUMENT_TYPES.SUPPORTING_DOCUMENTS]: 'Supporting Documents',
  [DOCUMENT_TYPES.PATENT_FORM]: 'Patent Form',
  [DOCUMENT_TYPES.NDA]: 'Non-Disclosure Agreement (NDA)',
}

// Patent Categories (ASSUMPTION - confirm with backend team)
export const PATENT_CATEGORIES = [
  'Mechanical',
  'Electrical',
  'Computer Science',
  'Electronics',
  'Civil',
  'Biotechnology',
  'Chemical',
  'Other',
]

// Department Options (ASSUMPTION - confirm with backend team)
export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Other',
]

// App Configuration
export const APP_CONFIG = {
  appName: 'SJEC Patent Management System',
  appVersion: '1.0.0',
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SCRUTINIZER: 'scrutinizer',
  REVIEW_TEAM: 'review_team',
  CONSULTANT: 'consultant',
  APPLICANT: 'applicant',
}

// User Role Display Labels
export const USER_ROLE_LABELS = {
  [USER_ROLES.APPLICANT]: 'Applicant (Student / Faculty)',
  [USER_ROLES.CONSULTANT]: 'Patent Consultant',
  [USER_ROLES.REVIEW_TEAM]: 'Review Team / Committee',
  [USER_ROLES.SCRUTINIZER]: 'Scrutinizer',
  [USER_ROLES.ADMIN]: 'IP Cell Admin',
}

// Predefined Demo Accounts (for quick login & testing)
export const PREDEFINED_ACCOUNTS = [
  {
    role: USER_ROLES.APPLICANT,
    label: 'Applicant',
    email: 'student@sjec.ac.in',
    password: 'password123',
    description: 'Student / Faculty Applicant',
  },
  {
    role: USER_ROLES.CONSULTANT,
    label: 'Consultant 1',
    email: 'consultant@sjec.ac.in',
    password: 'password123',
    description: 'Advocate External Consultant',
  },
  {
    role: USER_ROLES.CONSULTANT,
    label: 'Consultant 2',
    email: 'consultant2@sjec.ac.in',
    password: 'password123',
    description: 'Advocate Senior IP Consultant',
  },
  {
    role: USER_ROLES.REVIEW_TEAM,
    label: 'Review Team',
    email: 'reviewteam@sjec.ac.in',
    password: 'password123',
    description: 'Review Committee Member',
  },
  {
    role: USER_ROLES.ADMIN,
    label: 'Admin',
    email: 'admin@sjec.ac.in',
    password: 'password123',
    description: 'IP Cell Administrative Head',
  },
]

// Review Visibility
export const REVIEW_VISIBILITY = {
  APPLICANT: 'applicant',
  INTERNAL: 'internal',
}

export const REVIEW_VISIBILITY_LABELS = {
  [REVIEW_VISIBILITY.APPLICANT]: 'Visible to Applicant',
  [REVIEW_VISIBILITY.INTERNAL]: 'Internal Only',
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'patent_auth_token',
  REFRESH_TOKEN: 'patent_refresh_token',
  USER_DATA: 'patent_user_data',
}
