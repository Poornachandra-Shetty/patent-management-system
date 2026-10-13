/**
 * ProfileSection
 * Displays the logged-in user's real profile and allows editing of
 * permitted fields (name, mobile) via PATCH /auth/me/.
 *
 * Read-only fields (enforced by backend UserSerializer.read_only_fields):
 *   id, role, email, usn_or_emp_id, department, is_staff, is_superuser, created_at
 *
 * Editable fields:
 *   name, mobile
 */

import { useState, useEffect, useCallback } from 'react'
import { User, Lock, CheckCircle, AlertCircle, Pencil, X, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, getProfile } from '../../services/settingsService'
import './ProfileSection.css'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build initials from a full name, up to 2 characters */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Human-readable role label */
function roleLabel(role) {
  const map = { admin: 'Admin', scrutinizer: 'Scrutinizer', consultant: 'Consultant', applicant: 'Applicant' }
  return map[role] ?? role ?? '—'
}

/** Format ISO date string to readable date */
function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateForm(values) {
  const errors = {}
  if (!values.name.trim()) {
    errors.name = 'Full name is required.'
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  } else if (values.name.trim().length > 150) {
    errors.name = 'Name must be 150 characters or fewer.'
  }
  if (values.mobile && !/^\+?[\d\s\-().]{7,15}$/.test(values.mobile)) {
    errors.mobile = 'Enter a valid mobile number (7–15 digits).'
  }
  return errors
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ReadonlyField({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field__label">
        {label}
        <span className="profile-field__readonly-tag">
          <Lock size={9} /> Read-only
        </span>
      </span>
      <div className={`profile-field__value${!value ? ' profile-field__value--empty' : ''}`}>
        {value || '—'}
      </div>
    </div>
  )
}

function EditableField({ label, name, value, onChange, error, disabled, helperText }) {
  return (
    <div className="profile-field">
      <label className="profile-field__label" htmlFor={`profile-field-${name}`}>
        {label}
      </label>
      <input
        id={`profile-field-${name}`}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={[
          'profile-field__input',
          error ? 'profile-field__input--error' : '',
        ].filter(Boolean).join(' ')}
        autoComplete="off"
      />
      {error && (
        <p className="profile-field__error" role="alert">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="profile-field__helper">{helperText}</p>
      )}
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="profile-section__skeleton" aria-busy="true" aria-label="Loading profile">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="profile-skeleton__item">
          <div className="profile-skeleton__label" />
          <div className="profile-skeleton__value" />
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuth()

  // Remote profile state (may be fresher than cached user in AuthContext)
  const [profile, setProfile]       = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadError, setLoadError]   = useState(null)

  // Edit mode
  const [isEditing, setIsEditing]   = useState(false)
  const [formValues, setFormValues] = useState({ name: '', mobile: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving]         = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]   = useState(null)

  // ── Fetch fresh profile on mount ────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true)
    setLoadError(null)
    // Use cached user immediately so the page never feels empty
    if (user) setProfile(user)

    const result = await getProfile()
    if (result.success) {
      setProfile(result.data)
    } else {
      // If fetch fails, fall back to cached AuthContext user
      if (!user) setLoadError('Could not load profile. Please refresh.')
    }
    setLoadingProfile(false)
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // ── Derived display values ───────────────────────────────────────────────
  const displayData = profile ?? user ?? {}
  const initials    = getInitials(displayData.name)
  const deptName    = displayData.department_detail?.name ?? (displayData.department ? `Dept #${displayData.department}` : '—')

  // ── Edit mode handlers ───────────────────────────────────────────────────
  const startEditing = () => {
    setFormValues({ name: displayData.name ?? '', mobile: displayData.mobile ?? '' })
    setFormErrors({})
    setSaveSuccess(false)
    setSaveError(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setFormErrors({})
    setSaveError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    // Client-side validation
    const errors = validateForm(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSaving(true)
    const payload = {
      name:   formValues.name.trim(),
      mobile: formValues.mobile.trim(),
    }

    const result = await updateProfile(payload)
    setSaving(false)

    if (result.success) {
      // Update AuthContext so the navbar name refreshes immediately
      updateUser(result.data)
      // Update local profile state
      setProfile(result.data)
      setIsEditing(false)
      setSaveSuccess(true)
      // Auto-hide success message after 4 s
      setTimeout(() => setSaveSuccess(false), 4000)
    } else {
      // Parse backend field errors (DRF returns { field: ["msg"] })
      const data = result.error
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = {}
        if (data.name)   fieldErrors.name   = Array.isArray(data.name)   ? data.name[0]   : data.name
        if (data.mobile) fieldErrors.mobile = Array.isArray(data.mobile) ? data.mobile[0] : data.mobile
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors(fieldErrors)
          return
        }
      }
      setSaveError(typeof data === 'string' ? data : 'Failed to save profile. Please try again.')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loadingProfile && !displayData.name) {
    return (
      <div>
        <div className="profile-section__header">
          <div className="profile-section__header-text">
            <h2>My Profile</h2>
            <p>View and update your account details.</p>
          </div>
        </div>
        <SkeletonLoader />
      </div>
    )
  }

  if (loadError && !displayData.name) {
    return (
      <div>
        <div className="profile-section__header">
          <div className="profile-section__header-text">
            <h2>My Profile</h2>
          </div>
        </div>
        <div className="profile-section__alert profile-section__alert--error">
          <AlertCircle size={16} className="profile-section__alert-icon" />
          <span>{loadError}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="profile-section__header">
        <div className="profile-section__header-text">
          <h2>My Profile</h2>
          <p>View your account details. You can edit your name and mobile number.</p>
        </div>
        {!isEditing && (
          <div className="profile-section__header-actions">
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={startEditing}
              aria-label="Edit profile"
            >
              <Pencil size={14} /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="profile-section__alert profile-section__alert--success" role="status">
          <CheckCircle size={16} className="profile-section__alert-icon" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* Save error banner */}
      {saveError && (
        <div className="profile-section__alert profile-section__alert--error" role="alert">
          <AlertCircle size={16} className="profile-section__alert-icon" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Avatar row */}
      <div className="profile-section__avatar-row">
        <div className="profile-section__avatar" aria-hidden="true">
          {initials || <User size={28} />}
        </div>
        <div className="profile-section__avatar-info">
          <p className="profile-section__avatar-name">
            {displayData.name || '—'}
            <span className="profile-section__role-badge">{roleLabel(displayData.role)}</span>
          </p>
          <p className="profile-section__avatar-meta">
            {displayData.email || '—'} &nbsp;·&nbsp; {displayData.usn_or_emp_id || '—'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form className="profile-section__form" onSubmit={handleSubmit} noValidate>
        <div className="profile-section__grid">

          {/* Editable: Full Name */}
          {isEditing ? (
            <EditableField
              label="Full Name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              error={formErrors.name}
              disabled={saving}
              helperText="Your display name across the portal."
            />
          ) : (
            <ReadonlyField label="Full Name" value={displayData.name} />
          )}

          {/* Editable: Mobile */}
          {isEditing ? (
            <EditableField
              label="Mobile Number"
              name="mobile"
              value={formValues.mobile}
              onChange={handleChange}
              error={formErrors.mobile}
              disabled={saving}
              helperText="Contact number for the IP Cell."
            />
          ) : (
            <ReadonlyField label="Mobile Number" value={displayData.mobile} />
          )}

          {/* Read-only: Email */}
          <ReadonlyField label="Institutional Email" value={displayData.email} />

          {/* Read-only: USN / Employee ID */}
          <ReadonlyField label="USN / Employee ID" value={displayData.usn_or_emp_id} />

          {/* Read-only: Department */}
          <ReadonlyField label="Department" value={deptName} />

          {/* Read-only: Role */}
          <ReadonlyField label="Role" value={roleLabel(displayData.role)} />

          {/* Read-only: Member Since */}
          <ReadonlyField label="Member Since" value={formatDate(displayData.created_at)} />

        </div>

        {/* Form footer — only shown in edit mode */}
        {isEditing && (
          <div className="profile-section__form-footer">
            <button
              type="button"
              className="btn btn--secondary btn--medium"
              onClick={cancelEditing}
              disabled={saving}
            >
              <X size={15} /> Cancel
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
                <><Save size={15} /> Save Changes</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default ProfileSection
