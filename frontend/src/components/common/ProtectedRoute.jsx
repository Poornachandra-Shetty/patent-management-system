/**
 * ProtectedRoute Component
 * Guards routes that require authentication
 * Redirects to login if not authenticated
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="protected-route__loading">
        <div className="protected-route__spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated
  // Save the attempted URL for redirecting after login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Render protected content
  return children
}

export default ProtectedRoute
