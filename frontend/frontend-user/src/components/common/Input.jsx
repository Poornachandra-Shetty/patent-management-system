/**
 * Input Component
 * Reusable input field with label, error handling, and icons
 */

import { forwardRef } from 'react'
import './Input.css'

const Input = forwardRef(function Input({
  type = 'text',
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
  ...props
}, ref) {
  const inputId = `input-${name}`
  
  return (
    <div 
      className={`input-group ${fullWidth ? 'input-group--full-width' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
          {required && <span className="input-group__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={`input-group__wrapper ${error ? 'input-group__wrapper--error' : ''}`}>
        {icon && <span className="input-group__icon">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`input-group__input ${icon ? 'input-group__input--with-icon' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="input-group__error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="input-group__helper">{helperText}</p>
      )}
    </div>
  )
})

export default Input
