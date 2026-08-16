/**
 * AuthService
 * Authentication-related API calls
 */

import api, { getErrorMessage } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function login(email, password) {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
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
 * Get current user info
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getCurrentUser() {
  try {
    const response = await api.get('/auth/me/')
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
 * Check if token is valid
 * @returns {boolean}
 */
export function hasValidToken() {
  const token = localStorage.getItem('patent_auth_token')
  return !!token
}

/**
 * Clear auth data from storage
 */
export function clearAuthData() {
  localStorage.removeItem('patent_auth_token')
  localStorage.removeItem('patent_user_data')
}

export default {
  login,
  getCurrentUser,
  hasValidToken,
  clearAuthData,
}
