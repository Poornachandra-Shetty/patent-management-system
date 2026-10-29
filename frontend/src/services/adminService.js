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
 * Update patent fields
 * @param {number|string} id - Patent ID
 * @param {object} data - Fields accepted by the patent serializer
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
 * Transition a patent through the workflow
 * @param {string} patentId - Human-facing patent ID
 * @param {object} data - Workflow transition data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function transitionPatent(patentId, data) {
  try {
    const response = await api.post(`/workflow/${encodeURIComponent(patentId)}/transition/`, data)
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
      params: { application: patentId },
    })
    return {
      success: true,
      data: response.data.results,
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
 * @param {object} data - Review fields accepted by the review serializer
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
    let response = await api.get('/auth/users/', {
      params: { page_size: 100 },
    })
    const users = [...(response.data.results || [])]

    while (response.data.next) {
      response = await api.get(response.data.next)
      users.push(...(response.data.results || []))
    }

    return {
      success: true,
      data: {
        results: role ? users.filter((user) => user.role === role) : users,
      },
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
  transitionPatent,
  getReviews,
  createReview,
  getUsersByRole,
  getDepartments,
}
