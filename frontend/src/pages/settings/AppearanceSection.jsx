/**
 * AppearanceSection
 * Light / Dark mode selector — the ONLY content in this section
 * as specified in the project requirements.
 *
 * Uses ThemeContext (src/context/ThemeContext.jsx):
 *   - theme        : 'light' | 'dark'
 *   - setLightMode : () => void
 *   - setDarkMode  : () => void
 *   - isDark       : boolean
 *
 * Switching is immediate (no reload).
 * Preference is persisted to localStorage under key 'patent_theme'.
 * Defaults to 'light' when no preference is saved.
 * ThemeContext reads localStorage synchronously in its useState
 * initialiser, so data-theme is set before the first paint — no flicker.
 */

import { Sun, Moon, CheckCircle, Info } from 'lucide-react'
import { useTheme, THEMES } from '../../context/ThemeContext'
import './AppearanceSection.css'

// ── Mini portal preview mockup ──────────────────────────────────────────────

function LightPreview() {
  return (
    <div className="appearance-preview appearance-preview--light" aria-hidden="true">
      <div className="ap__sidebar">
        <div className="ap__sidebar-item ap__sidebar-item--active" />
        <div className="ap__sidebar-item" />
        <div className="ap__sidebar-item" />
        <div className="ap__sidebar-item" />
      </div>
      <div className="ap__main">
        <div className="ap__bar" />
        <div className="ap__bar ap__bar--short" />
        <div className="ap__card" />
        <div className="ap__bar ap__bar--shorter" />
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="appearance-preview appearance-preview--dark" aria-hidden="true">
      <div className="ap__sidebar">
        <div className="ap__sidebar-item ap__sidebar-item--active" />
        <div className="ap__sidebar-item" />
        <div className="ap__sidebar-item" />
        <div className="ap__sidebar-item" />
      </div>
      <div className="ap__main">
        <div className="ap__bar" />
        <div className="ap__bar ap__bar--short" />
        <div className="ap__card" />
        <div className="ap__bar ap__bar--shorter" />
      </div>
    </div>
  )
}

// ── ThemeOption ──────────────────────────────────────────────────────────────

function ThemeOption({ themeValue, label, icon: Icon, preview: Preview, isActive, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={`${label} mode`}
      className={`appearance-theme-option${isActive ? ' appearance-theme-option--active' : ''}`}
      onClick={() => onSelect(themeValue)}
    >
      <Preview />
      <div className="appearance-option__label-row">
        <span className="appearance-option__label-text">
          <Icon size={14} />
          {label}
        </span>
        <span className="appearance-option__check" aria-hidden="true">
          {isActive && <CheckCircle size={12} color="#fff" />}
        </span>
      </div>
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setLightMode, setDarkMode, isDark } = useTheme()

  const handleSelect = (selected) => {
    if (selected === THEMES.DARK) setDarkMode()
    else setLightMode()
  }

  return (
    <div>
      {/* Header */}
      <div className="appearance-section__header">
        <h2>Appearance &amp; Preferences</h2>
        <p>Choose between Light Mode and Dark Mode. The change applies instantly across the entire portal.</p>
      </div>

      <div className="appearance-card">
        <div className="appearance-card__heading">
          <div className="appearance-card__heading-icon">
            {isDark ? <Moon size={17} /> : <Sun size={17} />}
          </div>
          <div className="appearance-card__heading-text">
            <h3>Theme</h3>
            <p>Select your preferred colour scheme.</p>
          </div>
        </div>

        <div className="appearance-card__body">
          {/* Selector — role="radiogroup" for accessibility */}
          <div
            className="appearance-theme-grid"
            role="radiogroup"
            aria-label="Theme selection"
          >
            <ThemeOption
              themeValue={THEMES.LIGHT}
              label="Light"
              icon={Sun}
              preview={LightPreview}
              isActive={theme === THEMES.LIGHT}
              onSelect={handleSelect}
            />
            <ThemeOption
              themeValue={THEMES.DARK}
              label="Dark"
              icon={Moon}
              preview={DarkPreview}
              isActive={theme === THEMES.DARK}
              onSelect={handleSelect}
            />
          </div>

          {/* Active theme confirmation */}
          <div className="appearance-active-banner" role="status" aria-live="polite">
            <CheckCircle size={15} />
            {isDark ? 'Dark Mode is active.' : 'Light Mode is active.'} Your preference has been saved.
          </div>

          {/* Informational note */}
          <p className="appearance-note">
            <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            Your choice is stored in your browser and restored automatically the next time you visit.
            It is not synced across devices.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppearanceSection
