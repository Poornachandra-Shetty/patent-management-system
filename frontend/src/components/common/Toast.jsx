/**
 * Toast Component
 * Displays temporary notification messages
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
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
        {type === 'success' && <CheckCircle2 size={18} className="toast__icon" />}
        {type === 'error' && <XCircle size={18} className="toast__icon" />}
        {type === 'warning' && <AlertTriangle size={18} className="toast__icon" />}
        {type === 'info' && <Info size={18} className="toast__icon" />}
        <p className="toast__message">{message}</p>
      </div>
      <button className="toast__close" onClick={handleClose} aria-label="Close">
        <X size={14} />
      </button>
    </div>
  )
}

export default Toast
