// Application Constants

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login/',
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
  UNDER_SCRUTINY: 'under_scrutiny',
  FORWARDED_TO_CONSULTANT: 'forwarded_to_consultant',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// Status Display Labels
export const STATUS_LABELS = {
  [PATENT_STATUS.DRAFT]: 'Draft',
  [PATENT_STATUS.SUBMITTED]: 'Submitted',
  [PATENT_STATUS.UNDER_SCRUTINY]: 'Under Scrutiny',
  [PATENT_STATUS.FORWARDED_TO_CONSULTANT]: 'Forwarded to Consultant',
  [PATENT_STATUS.APPROVED]: 'Approved',
  [PATENT_STATUS.REJECTED]: 'Rejected',
}

// Status Colors (for styling)
export const STATUS_COLORS = {
  [PATENT_STATUS.DRAFT]: '#6b7280', // gray
  [PATENT_STATUS.SUBMITTED]: '#3b82f6', // blue
  [PATENT_STATUS.UNDER_SCRUTINY]: '#f59e0b', // amber
  [PATENT_STATUS.FORWARDED_TO_CONSULTANT]: '#8b5cf6', // purple
  [PATENT_STATUS.APPROVED]: '#10b981', // green
  [PATENT_STATUS.REJECTED]: '#ef4444', // red
}

// Document Types
export const DOCUMENT_TYPES = {
  SUPPORTING_DOCUMENTS: 'supporting_documents',
  PATENT_FORM: 'patent_form',
  NDA: 'nda',
}

// Document Type Labels
export const DOCUMENT_TYPE_LABELS = {
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

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'patent_auth_token',
  USER_DATA: 'patent_user_data',
}
