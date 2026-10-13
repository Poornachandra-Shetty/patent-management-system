/**
 * SecuritySection
 * Provides:
 *   1. Change Password form — POST /auth/change-password/
 *      Fields: current_password, new_password, confirm_password
 *      Show/hide toggle per field.
 *      Client validation + server-side error mapping.
 *      Clears form on success.
 *
 *   2. Session & Logout
 *      Current session indicator.
 *      Logout button calls AuthContext.logout() and redirects to /login.
 *      Note about JWT — active session management is not supported by the
 *      backend (stateless JWT); this is explicitly stated to the user.
 *
 * No passwords are displayed or stored beyond the controlled inputs.
 * No tokens or credentials are shown in the UI.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../services/settingsService'
import './SecuritySection.css'

// ── Password requirement rules ─────────────────────────────────────────────
const REQUIREMENTS = [
  { id: 'length',  label: 'At least 8 characters',         test: (v) => v.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter',  test: (v) => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'At least one lowercase letter',  test: (v) => /[a-z]/.test(v) },
  { id: 'digit',   label: 'At least one number',            test: (v) => /\d/.test(v) },
]

// ── Client-side validation ─────────────────────────────────────────────────
function validateForm({ current_password, new_password, confirm_password }) {
  const errors = {}
  if (!current_password) errors.current_password = 'Current password is required.'
  if (!new_password)      errors.new_password     = 'New password is required.'
  else if (new_password.length < 8) errors.new_password = 'Password must be at least 8 characters.'
  if (!confirm_password)  errors.confirm_password = 'Please confirm your new password.'
  else if (new_password && new_password !== confirm_password)
    errors.confirm_password = 'Passwords do not match.'
  if (current_password && new_password && current_password === new_password)
    errors.new_password = 'New password must be different from the current password.'
  return errors
}

// ── PasswordField sub-component ────────────────────────────────────────────
function PasswordField({ id, label, name, value, onChange, error, disabled, helperText, showReqs }) {
  const [show, setShow] = useState(false)

  const metCount = showReqs ? REQUIREMENTS.filter((r) => r.test(value)).length : 0

  return (
    <div className="security-field">
      <label className="security-field__label" htmlFor={id}>{label}</label>

      <div className={`security-field__input-row${error ? ' security-field__input-row--error' : ''}`}>
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={name === 'current_password' ? 'current-password' : 'new-password'}
          className="security-field__input"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="security-field__toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="security-field__error" role="alert">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {helperText && !error && (
        <p className="security-field__helper">{helperText}</p>
      )}

      {/* Live password requirements — only shown for new_password when it has input */}
      {showReqs && value.length > 0 && (
        <ul className="security-requirements" aria-label="Password requirements">
          {REQUIREMENTS.map((req) => {
            const met = req.test(value)
            return (
              <li key={req.id} className={met ? 'req--met' : 'req--unmet'}>
                <span className="security-requirements__icon">
                  {met
                    ? <CheckCircle size={12} color="#059669" />
                    : <AlertCircle size={12} color="var(--color-text-muted)" />}
                </span>
                {req.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── ChangePasswordCard ─────────────────────────────────────────────────────
function ChangePasswordCard() {
  const EMPTY = { current_password: '', new_password: '', confirm_password: '' }
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (serverError)  setServerError(null)
    if (success)      setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    setSuccess(false)

    // Client validation
    const clientErrors = validateForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setSaving(true)
    const result = await changePassword({
      current_password:  form.current_password,
      new_password:      form.new_password,
      confirm_password:  form.confirm_password,
    })
    setSaving(false)

    if (result.success) {
      setForm(EMPTY)
      setErrors({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } else {
      // Map DRF field errors back to form fields
      const raw = result.error
      if (raw && typeof raw === 'object') {
        const mapped = {}
        if (raw.current_password)  mapped.current_password  = Array.isArray(raw.current_password)  ? raw.current_password[0]  : raw.current_password
        if (raw.new_password)      mapped.new_password      = Array.isArray(raw.new_password)      ? raw.new_password[0]      : raw.new_password
        if (raw.confirm_password)  mapped.confirm_password  = Array.isArray(raw.confirm_password)  ? raw.confirm_password[0]  : raw.confirm_password
        if (Object.keys(mapped).length > 0) { setErrors(mapped); return }
        if (raw.non_field_errors)  { setServerError(Array.isArray(raw.non_field_errors) ? raw.non_field_errors[0] : raw.non_field_errors); return }
        if (raw.detail)            { setServerError(raw.detail); return }
      }
      setServerError(typeof raw === 'string' ? raw : 'Failed to change password. Please try again.')
    }
  }

  const handleReset = () => {
    setForm(EMPTY)
    setErrors({})
    setServerError(null)
    setSuccess(false)
  }

  return (
    <div className="security-card">
      <div className="security-card__heading">
        <div className="security-card__heading-icon"><Lock size={17} /></div>
        <div className="security-card__heading-text">
          <h3>Change Password</h3>
          <p>Use a strong password you don't use elsewhere.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="security-card__body">
          {success && (
            <div className="security-alert security-alert--success" role="status">
              <CheckCircle size={16} className="security-alert__icon" />
              Password changed successfully. Your next login will require the new password.
            </div>
          )}
          {serverError && (
            <div className="security-alert security-alert--error" role="alert">
              <AlertCircle size={16} className="security-alert__icon" />
              {serverError}
            </div>
          )}

          <PasswordField
            id="sec-current"
            label="Current Password"
            name="current_password"
            value={form.current_password}
            onChange={handleChange}
            error={errors.current_password}
            disabled={saving}
          />

          <PasswordField
            id="sec-new"
            label="New Password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            error={errors.new_password}
            disabled={saving}
            showReqs
            helperText="Minimum 8 characters with uppercase, lowercase, and a number."
          />

          <PasswordField
            id="sec-confirm"
            label="Confirm New Password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
            disabled={saving}
          />
        </div>

        <div className="security-card__footer">
          <button
            type="button"
            className="btn btn--secondary btn--medium"
            onClick={handleReset}
            disabled={saving}
          >
            Clear
          </button>
          <button
            type="submit"
            className="btn btn--primary btn--medium"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="btn__spinner" aria-hidden="true" />
                <span className="btn__text--hidden">Saving…</span>
              </>
            ) : (
              <><ShieldCheck size={15} /> Update Password</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── SessionCard ────────────────────────────────────────────────────────────
function SessionCard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    setLoggingOut(true)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="security-card">
      <div className="security-card__heading">
        <div className="security-card__heading-icon"><LogOut size={17} /></div>
        <div className="security-card__heading-text">
          <h3>Session &amp; Logout</h3>
          <p>Manage your current login session.</p>
        </div>
      </div>

      <div className="security-card__body">
        <div className="security-session-info">
          <div className="security-session-info__dot" aria-hidden="true" />
          <div className="security-session-info__text">
            <p className="security-session-info__label">
              Active session — {user?.name || 'You are logged in'}
            </p>
            <p className="security-session-info__sub">
              {user?.email} &nbsp;·&nbsp; Role: {user?.role ?? '—'}
            </p>
          </div>
        </div>

        <p className="security-jwt-note">
          <Info size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          This portal uses JWT authentication. Active session management (viewing or revoking
          other sessions) is not supported — only the current browser session can be ended here.
        </p>
      </div>

      <div className="security-card__footer">
        <button
          type="button"
          className="btn btn--danger btn--medium"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <span className="btn__spinner" aria-hidden="true" />
              <span className="btn__text--hidden">Logging out…</span>
            </>
          ) : (
            <><LogOut size={15} /> Log Out</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
function SecuritySection() {
  return (
    <div>
      <div className="security-section__header">
        <h2>Security &amp; Password</h2>
        <p>Change your password and manage your active session.</p>
      </div>

      <ChangePasswordCard />
      <SessionCard />
    </div>
  )
}

export default SecuritySection
