import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor - attach auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patent_auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login ONLY for authenticated endpoints.
    // Skip redirect when the request is to the login/register endpoint itself,
    // so the login form can display the "Invalid credentials" error instead of
    // silently bouncing the user back to the login page.
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint =
      requestUrl.includes('/auth/login/') ||
      requestUrl.includes('/auth/register/') ||
      requestUrl.includes('/auth/refresh/')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('patent_auth_token')
      localStorage.removeItem('patent_refresh_token')
      localStorage.removeItem('patent_user_data')
      // Only redirect if we are not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api

// Helper functions for common API operations

/**
 * Handle API errors consistently
 * @param {Error} error - The error object from catch block
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.response?.data && typeof error.response.data === 'object') {
    const entries = Object.entries(error.response.data)
    if (entries.length > 0) {
      const [field, val] = entries[0]
      if (Array.isArray(val) && val.length > 0) {
        return `${field}: ${val[0]}`
      }
      if (typeof val === 'string') {
        return `${field}: ${val}`
      }
    }
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('patent_auth_token')
}

/**
 * Get stored user data
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem('patent_user_data')
  return userData ? JSON.parse(userData) : null
}
