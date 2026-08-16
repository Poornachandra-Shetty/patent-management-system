/**
 * PatentService
 * Patent-related API calls
 */

import api, { getErrorMessage } from './api'
import { API_ENDPOINTS } from '../utils/constants'
import { MOCK_PATENTS, MOCK_STATS, USE_MOCK_DATA, mockDelay } from './mockData'

/**
 * Get all patents for the current user
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getMyPatents() {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay()
    return {
      success: true,
      data: {
        patents: MOCK_PATENTS,
        stats: MOCK_STATS,
      },
    }
  }

  try {
    const response = await api.get(API_ENDPOINTS.PATENTS)
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
 * Get a single patent by ID
 * @param {number|string} id - Patent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPatentById(id) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay()
    const patent = MOCK_PATENTS.find(p => p.id === parseInt(id))
    if (patent) {
      return {
        success: true,
        data: patent,
      }
    }
    return {
      success: false,
      error: 'Patent not found',
    }
  }

  try {
    const response = await api.get(API_ENDPOINTS.PATENT_DETAIL(id))
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
 * Create a new patent application
 * @param {object} patentData - Patent form data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createPatent(patentData) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay(1000)
    const newPatent = {
      id: MOCK_PATENTS.length + 1,
      patent_id: `PAT-2026-NEW-${String(MOCK_PATENTS.length + 1).padStart(3, '0')}`,
      ...patentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_PATENTS.push(newPatent)
    return {
      success: true,
      data: newPatent,
    }
  }

  try {
    const response = await api.post(API_ENDPOINTS.PATENTS, patentData)
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
 * Submit a patent for review
 * @param {number|string} id - Patent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function submitPatent(id) {
  // Use mock data if enabled
  if (USE_MOCK_DATA) {
    await mockDelay(1000)
    const patentIndex = MOCK_PATENTS.findIndex(p => p.id === parseInt(id))
    if (patentIndex !== -1) {
      MOCK_PATENTS[patentIndex].status = 'submitted'
      MOCK_PATENTS[patentIndex].updated_at = new Date().toISOString()
      return {
        success: true,
        data: MOCK_PATENTS[patentIndex],
      }
    }
    return {
      success: false,
      error: 'Patent not found',
    }
  }

  try {
    const response = await api.post(API_ENDPOINTS.PATENT_SUBMIT(id))
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
  getMyPatents,
  getPatentById,
  createPatent,
  submitPatent,
}
