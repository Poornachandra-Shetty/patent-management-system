/**
 * ReviewService
 * Review/Remarks-related API calls
 */

import api, { getErrorMessage } from './api'
import { API_ENDPOINTS } from '../utils/constants'
import { MOCK_REMARKS, USE_MOCK_DATA, mockDelay } from './mockData'

/**
 * Get remarks for a patent application
 * @param {number} applicationId - Patent application ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getRemarks(applicationId) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay()
    const remarks = MOCK_REMARKS.filter(r => r.application_id === parseInt(applicationId))
    return {
      success: true,
      data: remarks,
    }
  }

  try {
    const response = await api.get(`${API_ENDPOINTS.REVIEWS}?application_id=${applicationId}`)
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

export default {
  getRemarks,
}
