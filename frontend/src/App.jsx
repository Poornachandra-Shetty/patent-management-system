import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Bell, ChevronDown, FileText, LayoutGrid, Search, Settings, UserCircle2, Users } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar, ProtectedRoute } from './components/common'
import { LoginPage, AboutPage, DashboardPage, NewPatentPage, PatentDetailsPage, DocumentsPage, AdminDashboard, AdminPatentDetail } from './pages'
import { USER_ROLES } from './utils/constants'
import './App.css'

const sidebarItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
  { label: 'Patents', to: '/patents/new', icon: FileText },
  { label: 'Reviews', to: '/admin/dashboard', icon: FileText },
  { label: 'Workflow', to: '/dashboard', icon: Users },
  { label: 'Notifications', to: '/dashboard', icon: Bell },
]

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

  const userRole = user?.role
  const isStaff = [USER_ROLES.ADMIN, USER_ROLES.SCRUTINIZER, USER_ROLES.CONSULTANT].includes(userRole)

  const filteredSidebarItems = sidebarItems.filter((item) => {
    // Hide "Patents" (which opens New Patent form) from reviewers/admins
    if (item.label === 'Patents' && isStaff) return false
    // Hide "Reviews" from applicants (student/faculty)
    if (item.label === 'Reviews' && !isStaff) return false
    return true
  })

  return (
    <div className="app">
      <Navbar
        isLoggedIn={isAuthenticated}
        userName={user?.name || ''}
        user={user}
        onLogout={handleLogout}
      />

      <div className="app-shell__body">
        {isAuthenticated && (
          <aside className="app-shell__sidebar" aria-label="Sidebar navigation">
            <div className="sidebar__header">
              <div className="sidebar__logo-pill">SJ</div>
              <div>
                <p className="sidebar__eyebrow">Portal</p>
                <h2>Patent Desk</h2>
              </div>
            </div>

            <nav className="sidebar__nav">
              {filteredSidebarItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={label === 'Dashboard'}
                  className={({ isActive }) =>
                    ['sidebar__item', label === 'Dashboard' && isActive ? 'sidebar__item--active' : '']
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  <span className="sidebar__icon"><Icon size={18} /></span>
                  <span>{label}</span>
                </NavLink>
              ))}

              <NavLink
                to="/dashboard"
                className="sidebar__item"
              >
                <span className="sidebar__icon"><Settings size={18} /></span>
                <span>Settings</span>
              </NavLink>
            </nav>
          </aside>
        )}

        <main className={`app-shell__main ${isAuthenticated ? 'app-shell__main--with-sidebar' : ''}`}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<PlaceholderPage title="Team" />} />
            <Route path="/patents" element={<PlaceholderPage title="Patents" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<PlaceholderPage title="Sign Up" />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patents/:id"
              element={
                <ProtectedRoute>
                  <AdminPatentDetail />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="landing-page">
      <section className="landing-page__hero">
        <div className="landing-page__content">
          <p className="landing-page__eyebrow">Innovation • Research • Impact</p>
          <h2>Welcome to Patent Management System</h2>
          <p>
            Modern research and intellectual property workflows for the college community,
            supporting innovation, review, and academic excellence.
          </p>
        </div>
      </section>

      <div className="landing-page__image-panel">
        <img
          src="/photos/About.png"
          alt="About SJEC"
          className="landing-page__image"
        />
      </div>
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

function DashboardRouter() {
  const { user } = useAuth()

  const isAdmin = user?.role === USER_ROLES.ADMIN
  const isScrutinizer = user?.role === USER_ROLES.SCRUTINIZER
  const isConsultant = user?.role === USER_ROLES.CONSULTANT

  if (isAdmin || isScrutinizer || isConsultant) {
    return <AdminDashboard />
  }

  return <DashboardPage />
}

export default App
