/**
 * Modal Component
 * Displays a modal dialog for user interactions
 */

import './Modal.css'

function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__footer">
          <button className="modal__button modal__button--cancel" onClick={onClose}>
            {cancelText}
          </button>
          {onConfirm && (
            <button
              className={`modal__button modal__button--confirm ${isDanger ? 'modal__button--danger' : ''}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
