/**
 * ThemeContext
 * Provides light/dark mode state across the entire portal.
 * Persists selection to localStorage under key 'patent_theme'.
 * Applies 'data-theme' attribute to <html> element for CSS variable overrides.
 * Defaults to 'light' when no preference is stored.
 */

import { createContext, useContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'patent_theme'
const THEMES = { LIGHT: 'light', DARK: 'dark' }

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Read persisted preference synchronously to avoid flicker
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT
  })

  // Apply data-theme to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT))

  const setLightMode = () => setTheme(THEMES.LIGHT)
  const setDarkMode = () => setTheme(THEMES.DARK)

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setLightMode, setDarkMode, isDark: theme === THEMES.DARK }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export { THEMES }
export default ThemeContext
