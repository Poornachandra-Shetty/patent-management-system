import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar, ProtectedRoute } from './components/common'
import { LoginPage, DashboardPage, NewPatentPage, PatentDetailsPage, DocumentsPage } from './pages'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

function AppContent() {
  const { user, isAuthenticated, logout, loading } = useAuth()

  const handleLogout = () => {
    logout()
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app">
        <div className="app-loading">
          <div className="app-loading__spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar 
        isLoggedIn={isAuthenticated} 
        userName={user?.name || ''}
        onLogout={handleLogout}
      />
      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<PlaceholderPage title="About" />} />
          <Route path="/team" element={<PlaceholderPage title="Team" />} />
          <Route path="/patents" element={<PlaceholderPage title="Patents" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<PlaceholderPage title="Sign Up" />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patents/new" 
            element={
              <ProtectedRoute>
                <NewPatentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patents/:id" 
            element={
              <ProtectedRoute>
                <PatentDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patents/:id/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patents/:id/edit" 
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Edit Patent" subtitle="Will be implemented later" />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <div className="home-placeholder">
      <h2>Welcome to Patent Management System</h2>
      <p>Block 04 — Protected Routes & Dashboard completed. Ready for Block 05.</p>
    </div>
  )
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        <p className="page__subtitle">{subtitle || 'This page will be implemented in upcoming blocks.'}</p>
      </div>
    </div>
  )
}

export default App
