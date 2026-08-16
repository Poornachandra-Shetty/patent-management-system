/**
 * Button Component
 * Reusable button with multiple variants and states
 */

import './Button.css'

function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) {
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    loading ? 'btn--loading' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true"></span>
      ) : null}
      <span className={loading ? 'btn__text--hidden' : ''}>{children}</span>
    </button>
  )
}

export default Button
