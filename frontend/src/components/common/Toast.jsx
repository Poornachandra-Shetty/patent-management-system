/**
 * Toast Component
 * Displays temporary notification messages
 */

import { useEffect, useState } from 'react'
import './Toast.css'

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const toastClass = `toast toast--${type}`

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div className={toastClass}>
      <div className="toast__content">
        {type === 'success' && <span className="toast__icon">✓</span>}
        {type === 'error' && <span className="toast__icon">✕</span>}
        {type === 'warning' && <span className="toast__icon">⚠</span>}
        {type === 'info' && <span className="toast__icon">ℹ</span>}
        <p className="toast__message">{message}</p>
      </div>
      <button className="toast__close" onClick={handleClose} aria-label="Close">
        ×
      </button>
    </div>
  )
}

export default Toast
