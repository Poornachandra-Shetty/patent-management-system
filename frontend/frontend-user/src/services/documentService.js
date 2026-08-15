/**
 * DocumentService
 * Document-related API calls
 */

import api, { getErrorMessage } from './api'
import { API_ENDPOINTS } from '../utils/constants'
import { MOCK_DOCUMENTS, USE_MOCK_DATA, mockDelay } from './mockData'

/**
 * Upload a document
 * @param {number} applicationId - Patent application ID
 * @param {string} docType - Document type (supporting_documents, patent_form, nda)
 * @param {File} file - File to upload
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function uploadDocument(applicationId, docType, file, onProgress) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        await mockDelay(100)
        onProgress(i)
      }
    }
    
    const newDocument = {
      id: MOCK_DOCUMENTS.length + 1,
      application_id: parseInt(applicationId),
      doc_type: docType,
      file_url: `/documents/${file.name}`,
      uploaded_at: new Date().toISOString(),
    }
    MOCK_DOCUMENTS.push(newDocument)
    
    return {
      success: true,
      data: newDocument,
    }
  }

  try {
    const formData = new FormData()
    formData.append('application_id', applicationId)
    formData.append('doc_type', docType)
    formData.append('file', file)

    const response = await api.post(API_ENDPOINTS.DOCUMENTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

/**
 * Get documents for an application
 * @param {number} applicationId - Patent application ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getDocuments(applicationId) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay()
    const documents = MOCK_DOCUMENTS.filter(d => d.application_id === parseInt(applicationId))
    return {
      success: true,
      data: documents,
    }
  }

  try {
    const response = await api.get(`${API_ENDPOINTS.DOCUMENTS}?application_id=${applicationId}`)
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

/**
 * Delete a document
 * @param {number} documentId - Document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteDocument(documentId) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay()
    const index = MOCK_DOCUMENTS.findIndex(d => d.id === parseInt(documentId))
    if (index !== -1) {
      MOCK_DOCUMENTS.splice(index, 1)
    }
    return {
      success: true,
    }
  }

  try {
    await api.delete(`${API_ENDPOINTS.DOCUMENTS}${documentId}/`)
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed',
    }
  }

  return { valid: true }
}

export default {
  uploadDocument,
  getDocuments,
  deleteDocument,
  validateFile,
}
