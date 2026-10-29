/**
 * SettingsPage
 * Main settings shell with an inner sidebar and section routing.
 *
 * Sidebar items are role-gated:
 *   All roles  : My Profile, Security & Password, Notifications,
 *                Appearance & Preferences, Help & Support
 *   Admin only : User & Role Management, Department Management,
 *                Audit Logs
 *
 * Each section is its own sub-component. Stubs are rendered now;
 * full implementations are added phase-by-phase.
 */

import { useState } from 'react'
import {
  User,
  Lock,
  Bell,
  Sun,
  HelpCircle,
  ShieldCheck,
  Users,
  Building2,
  ClipboardList,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { USER_ROLES } from '../utils/constants'

import ProfileSection      from './settings/ProfileSection'
import SecuritySection     from './settings/SecuritySection'
import NotificationsSection from './settings/NotificationsSection'
import AppearanceSection   from './settings/AppearanceSection'
import HelpSection         from './settings/HelpSection'
import AdminSection        from './settings/AdminSection'

import './SettingsPage.css'

// ── Section definitions ────────────────────────────────────────────────────
const SECTIONS = {
  PROFILE:       'profile',
  SECURITY:      'security',
  NOTIFICATIONS: 'notifications',
  APPEARANCE:    'appearance',
  HELP:          'help',
  // Admin-only
  USERS:         'users',
  DEPARTMENTS:   'departments',
  AUDIT:         'audit',
}

/** Items visible to every authenticated user */
const COMMON_NAV_ITEMS = [
  { id: SECTIONS.PROFILE,       label: 'My Profile',              icon: User },
  { id: SECTIONS.SECURITY,      label: 'Security & Password',     icon: Lock },
  { id: SECTIONS.NOTIFICATIONS, label: 'Notifications',           icon: Bell },
  { id: SECTIONS.APPEARANCE,    label: 'Appearance',              icon: Sun },
  { id: SECTIONS.HELP,          label: 'Help & Support',          icon: HelpCircle },
]

/** Additional items only for admin role */
const ADMIN_NAV_ITEMS = [
  { id: SECTIONS.USERS,        label: 'User Management',    icon: Users },
  { id: SECTIONS.DEPARTMENTS,  label: 'Departments',        icon: Building2 },
  { id: SECTIONS.AUDIT,        label: 'Audit Logs',         icon: ClipboardList },
]

// ── Section renderer ───────────────────────────────────────────────────────
function renderSection(activeSection) {
  switch (activeSection) {
    case SECTIONS.PROFILE:       return <ProfileSection />
    case SECTIONS.SECURITY:      return <SecuritySection />
    case SECTIONS.NOTIFICATIONS: return <NotificationsSection />
    case SECTIONS.APPEARANCE:    return <AppearanceSection />
    case SECTIONS.HELP:          return <HelpSection />
    // Admin sections all use AdminSection until Phase 8 implements them separately
    case SECTIONS.USERS:
    case SECTIONS.DEPARTMENTS:
    case SECTIONS.AUDIT:
      return <AdminSection activeTab={activeSection} />
    default:
      return <ProfileSection />
  }
}

// ── Component ──────────────────────────────────────────────────────────────
function SettingsPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState(SECTIONS.PROFILE)

  const isAdmin = user?.role === USER_ROLES.ADMIN

  const navItems = isAdmin
    ? [...COMMON_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : COMMON_NAV_ITEMS

  return (
    <div className="settings-page">
      {/* Page header */}
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">
          Manage your account, security, notifications, and preferences.
        </p>
      </div>

      {/* Body: inner sidebar + content */}
      <div className="settings-page__body">

        {/* Inner sidebar navigation */}
        <nav className="settings-nav" aria-label="Settings navigation">
          <span className="settings-nav__section-label">Account</span>

          {COMMON_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-nav__item${activeSection === id ? ' settings-nav__item--active' : ''}`}
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
            >
              <span className="settings-nav__item-icon"><Icon size={16} /></span>
              <span className="settings-nav__item-label">{label}</span>
            </button>
          ))}

          {isAdmin && (
            <>
              <span className="settings-nav__section-label">Administration</span>
              {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`settings-nav__item${activeSection === id ? ' settings-nav__item--active' : ''}`}
                  onClick={() => setActiveSection(id)}
                  aria-current={activeSection === id ? 'page' : undefined}
                >
                  <span className="settings-nav__item-icon"><Icon size={16} /></span>
                  <span className="settings-nav__item-label">{label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Section content panel */}
        <main className="settings-content" aria-live="polite">
          {renderSection(activeSection)}
        </main>

      </div>
    </div>
  )
}

export default SettingsPage
