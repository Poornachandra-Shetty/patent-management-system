/**
 * AuthContext
 * Authentication state management for the application
 * Handles login, logout, and token persistence
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { getErrorMessage } from '../services/api'
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants'

// Create context
const AuthContext = createContext(null)

// Auth Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      }
    }
    setLoading(false)
  }, [])

  // Login function
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      })

      const tokenFromResponse = response.data.access || response.data.token
      let userData = response.data.user

      if (!userData && tokenFromResponse) {
        const profileResponse = await api.get('/auth/me/')
        userData = profileResponse.data
      }

      if (!tokenFromResponse) {
        throw new Error('Authentication failed: no token returned by server')
      }

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenFromResponse)
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData || {}))

      // Update state
      setToken(tokenFromResponse)
      setUser(userData || null)

      return { success: true, user: userData || null }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    setToken(null)
    setUser(null)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Check if authenticated
  const isAuthenticated = !!token && !!user

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
