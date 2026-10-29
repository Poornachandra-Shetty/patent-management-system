/**
 * NotificationsSection
 *
 * Two panels:
 *
 * 1. In-App Notification Preferences
 *    GET/PATCH /notifications/preferences/
 *    Toggles for status_change_in_app and remark_added_in_app.
 *    Email delivery is NOT implemented — shown as clearly unavailable.
 *    Role-aware descriptions shown per toggle.
 *
 * 2. Recent In-App Notifications
 *    GET /notifications/ (latest 10)
 *    Shows title, event type badge, read/unread state, timestamp.
 *    "Mark all as read" button.
 *
 * No fake toggles — every toggle maps to a real persisted preference
 * that gates actual notification creation in the backend services.
 */

import { useState, useEffect, useCallback } from 'react'
import { Bell, Mail, CheckCircle, AlertCircle, RefreshCw, BellOff, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotifications,
} from '../../services/settingsService'
import api from '../../services/api'
import './NotificationsSection.css'

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 30)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Role-specific descriptions for each preference toggle */
function getToggleDescriptions(role) {
  const isApplicant   = role === 'applicant'
  const isConsultant  = role === 'consultant'
  const isScrutinizer = role === 'scrutinizer'
  const isAdmin       = role === 'admin'

  return {
    status_change_in_app: isApplicant
      ? 'Notify me when my patent application changes status (submitted, under scrutiny, approved, rejected, etc.).'
      : isConsultant
        ? 'Notify me when a patent assigned to me changes status.'
        : isScrutinizer
          ? 'Notify me when a submitted patent changes status during review.'
          : isAdmin
            ? 'Notify me of any patent status change in the portal.'
            : 'Notify me of patent status changes.',
    remark_added_in_app: isApplicant
      ? 'Notify me when a reviewer adds a remark visible to me on my patent.'
      : isConsultant
        ? 'Notify me when an internal remark is added to a patent assigned to me.'
        : isScrutinizer
          ? 'Notify me when a remark is added to a patent under review.'
          : isAdmin
            ? 'Notify me when any remark is added to a patent.'
            : 'Notify me when a remark is added to a patent.',
  }
}

// ── ToggleSwitch ───────────────────────────────────────────────────────────

function ToggleSwitch({ id, checked, onChange, disabled }) {
  return (
    <label className="notif-toggle" htmlFor={id} aria-label="Toggle notification">
      <input
        id={id}
        type="checkbox"
        className="notif-toggle__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span
        className={[
          'notif-toggle__track',
          checked   ? 'notif-toggle__track--checked'  : '',
          disabled  ? 'notif-toggle__track--disabled' : '',
        ].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        <span className="notif-toggle__thumb" />
      </span>
    </label>
  )
}

// ── PreferencesCard ────────────────────────────────────────────────────────

function PreferencesCard({ role }) {
  const descriptions = getToggleDescriptions(role)

  const [prefs,    setPrefs]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [dirty,    setDirty]    = useState(false)
  const [saveOk,   setSaveOk]   = useState(false)
  const [saveErr,  setSaveErr]  = useState(null)
  const [loadErr,  setLoadErr]  = useState(null)

  const fetchPrefs = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    const result = await getNotificationPreferences()
    if (result.success) {
      setPrefs(result.data)
    } else {
      setLoadErr('Could not load preferences. Please try again.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPrefs() }, [fetchPrefs])

  const handleToggle = (field) => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }))
    setDirty(true)
    setSaveOk(false)
    setSaveErr(null)
  }

  const handleSave = async () => {
    if (!dirty || !prefs) return
    setSaving(true)
    setSaveErr(null)
    setSaveOk(false)

    const result = await updateNotificationPreferences({
      status_change_in_app: prefs.status_change_in_app,
      remark_added_in_app:  prefs.remark_added_in_app,
    })

    setSaving(false)
    if (result.success) {
      setPrefs(result.data)
      setDirty(false)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 4000)
    } else {
      setSaveErr('Failed to save preferences. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="notif-card">
        <div className="notif-card__heading">
          <div className="notif-card__heading-icon"><Bell size={17} /></div>
          <div className="notif-card__heading-text">
            <h3>In-App Notifications</h3>
            <p>Choose which events trigger in-app alerts.</p>
          </div>
        </div>
        <div className="notif-skeleton">
          {[1, 2].map((i) => (
            <div key={i} className="notif-skeleton__row">
              <div className="notif-skeleton__dot" />
              <div className="notif-skeleton__lines">
                <div className="notif-skeleton__line" style={{ width: '55%' }} />
                <div className="notif-skeleton__line" style={{ width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loadErr) {
    return (
      <div className="notif-card">
        <div className="notif-card__heading">
          <div className="notif-card__heading-icon"><Bell size={17} /></div>
          <div className="notif-card__heading-text"><h3>In-App Notifications</h3></div>
        </div>
        <div className="notif-alert notif-alert--error" style={{ margin: '16px 20px' }}>
          <AlertCircle size={14} /> {loadErr}
        </div>
      </div>
    )
  }

  return (
    <div className="notif-card">
      <div className="notif-card__heading">
        <div className="notif-card__heading-icon"><Bell size={17} /></div>
        <div className="notif-card__heading-text">
          <h3>In-App Notifications</h3>
          <p>Choose which events trigger in-app alerts for your role.</p>
        </div>
      </div>

      <div className="notif-card__body">
        {/* Status change toggle */}
        <div className="notif-toggle-row">
          <div className="notif-toggle-row__info">
            <p className="notif-toggle-row__label">Patent Status Changes</p>
            <p className="notif-toggle-row__desc">{descriptions.status_change_in_app}</p>
          </div>
          <ToggleSwitch
            id="pref-status-change"
            checked={prefs?.status_change_in_app ?? true}
            onChange={() => handleToggle('status_change_in_app')}
            disabled={saving}
          />
        </div>

        {/* Remark added toggle */}
        <div className="notif-toggle-row">
          <div className="notif-toggle-row__info">
            <p className="notif-toggle-row__label">Reviewer Remarks</p>
            <p className="notif-toggle-row__desc">{descriptions.remark_added_in_app}</p>
          </div>
          <ToggleSwitch
            id="pref-remark-added"
            checked={prefs?.remark_added_in_app ?? true}
            onChange={() => handleToggle('remark_added_in_app')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Email — clearly labelled as not implemented */}
      <div className="notif-card__heading" style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none' }}>
        <div className="notif-card__heading-icon"><Mail size={17} /></div>
        <div className="notif-card__heading-text">
          <h3>Email Notifications</h3>
          <p>Delivery by email is not yet implemented in this portal.</p>
        </div>
      </div>
      <div className="notif-card__body">
        {[
          'Patent Status Changes via Email',
          'Reviewer Remarks via Email',
        ].map((label) => (
          <div key={label} className="notif-unavailable-row">
            <span className="notif-unavailable-row__badge">
              <Info size={9} /> Not available
            </span>
            <p className="notif-unavailable-row__label">{label}</p>
          </div>
        ))}
      </div>

      <div className="notif-card__footer">
        <span className="notif-card__footer-status">
          {saveOk && (
            <span className="notif-card__footer-status--success">
              <CheckCircle size={13} /> Preferences saved.
            </span>
          )}
          {saveErr && (
            <span className="notif-card__footer-status--error">
              <AlertCircle size={13} /> {saveErr}
            </span>
          )}
          {!saveOk && !saveErr && dirty && (
            <span>Unsaved changes</span>
          )}
        </span>
        <button
          type="button"
          className="btn btn--primary btn--medium"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? (
            <>
              <span className="btn__spinner" aria-hidden="true" />
              <span className="btn__text--hidden">Saving…</span>
            </>
          ) : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

// ── RecentNotificationsCard ────────────────────────────────────────────────

function RecentNotificationsCard() {
  const [notifications, setNotifications] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [loadErr,  setLoadErr]  = useState(null)
  const [marking,  setMarking]  = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    const result = await getNotifications({ limit: 10 })
    if (result.success) {
      const list = result.data?.results ?? (Array.isArray(result.data) ? result.data : [])
      setNotifications(list)
    } else {
      setLoadErr('Could not load notifications.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await api.patch('/notifications/mark-all-as-read/')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // silent — list still shows
    }
    setMarking(false)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="notif-card">
      <div className="notif-card__heading">
        <div className="notif-card__heading-icon">
          {unreadCount > 0 ? <Bell size={17} /> : <BellOff size={17} />}
        </div>
        <div className="notif-card__heading-text">
          <h3>
            Recent Notifications
            {unreadCount > 0 && (
              <span className="notif-list__badge notif-list__badge--status_change" style={{ marginLeft: 8 }}>
                {unreadCount} unread
              </span>
            )}
          </h3>
          <p>Your 10 most recent in-app notifications.</p>
        </div>
      </div>

      {loadErr && (
        <div className="notif-alert notif-alert--error" style={{ margin: '12px 20px 0' }}>
          <AlertCircle size={14} /> {loadErr}
        </div>
      )}

      <div className="notif-list">
        {loading ? (
          <div className="notif-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="notif-skeleton__row">
                <div className="notif-skeleton__dot" />
                <div className="notif-skeleton__lines">
                  <div className="notif-skeleton__line" style={{ width: '65%' }} />
                  <div className="notif-skeleton__line" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty__icon"><BellOff size={22} /></div>
            <p>No notifications yet.</p>
            <p>You will see status changes and remarks here once activity occurs on your patents.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-list__item${!n.is_read ? ' notif-list__item--unread' : ''}`}
            >
              <div className={`notif-list__dot${n.is_read ? ' notif-list__dot--read' : ''}`} aria-hidden="true" />
              <div className="notif-list__content">
                <p className="notif-list__title">
                  {n.title}
                  <span className={`notif-list__badge notif-list__badge--${n.event_type}`}>
                    {n.event_type === 'status_change' ? 'Status' : 'Remark'}
                  </span>
                </p>
                <p className="notif-list__meta">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && notifications.length > 0 && (
        <div className="notif-card__footer">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={fetchNotifications}
            aria-label="Refresh notifications"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handleMarkAllRead}
            disabled={marking || unreadCount === 0}
          >
            {marking ? (
              <>
                <span className="btn__spinner" aria-hidden="true" />
                <span className="btn__text--hidden">Marking…</span>
              </>
            ) : (
              <><CheckCircle size={13} /> Mark All as Read</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

function NotificationsSection() {
  const { user } = useAuth()

  return (
    <div>
      <div className="notif-section__header">
        <h2>Notifications</h2>
        <p>Control which in-app notifications you receive. Email delivery is not yet available.</p>
      </div>

      <PreferencesCard role={user?.role} />
      <RecentNotificationsCard />
    </div>
  )
}

export default NotificationsSection
