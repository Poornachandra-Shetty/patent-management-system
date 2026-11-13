/**
 * ProtectedRoute Component
 * Guards routes that require authentication.
 * Optionally restricts access to specific roles via the `allowedRoles` prop.
 * Redirects unauthenticated users to login, unauthorized roles to /dashboard.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children, redirectTo = '/login', allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth()
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

  // If specific roles are required, check that the user's role is allowed.
  // Unauthorized role → send to /dashboard (their own role-appropriate view).
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  // Render protected content
  return children
}

export default ProtectedRoute
