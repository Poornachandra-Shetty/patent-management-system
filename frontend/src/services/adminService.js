/**
 * AdminService
 * Admin/Scrutinizer/Consultant API calls
 */

import api, { getErrorMessage } from './api'

/**
 * Get patents with filters
 * @param {object} params - Query parameters (status, department, search, page, limit)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPatents(params = {}) {
  try {
    const response = await api.get('/patents/', { params })
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
 * Get patent by ID
 * @param {number|string} id - Patent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPatentDetail(id) {
  try {
    const response = await api.get(`/patents/${id}/`)
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
 * Update patent (assign consultant)
 * @param {number|string} id - Patent ID
 * @param {object} data - Update data (e.g., {consultant: 5})
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updatePatent(id, data) {
  try {
    const response = await api.patch(`/patents/${id}/`, data)
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
 * Get reviews for a patent
 * @param {number} patentId - Patent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getReviews(patentId) {
  try {
    const response = await api.get('/reviews/', {
      params: { patent: patentId },
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
 * Create a review/remark
 * @param {object} data - Review data {patent, remark, visibility}
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createReview(data) {
  try {
    const response = await api.post('/reviews/', data)
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
 * Get users by role (for consultant selection)
 * @param {string} role - User role (e.g., 'consultant')
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getUsersByRole(role) {
  try {
    const response = await api.get('/users/', {
      params: { role },
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
 * Get departments for filter
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getDepartments() {
  try {
    const response = await api.get('/departments/')
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
  getPatents,
  getPatentDetail,
  updatePatent,
  getReviews,
  createReview,
  getUsersByRole,
  getDepartments,
}
