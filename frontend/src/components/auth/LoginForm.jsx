/**
 * LoginForm Component
 * Login form with email and password fields
 * Handles validation and submission
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Card } from '../common'
import { PREDEFINED_ACCOUNTS } from '../../utils/constants'
import './LoginForm.css'

function LoginForm() {
  const navigate = useNavigate()
  const { login, loading, error, clearError, isAuthenticated } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  
  // Validation errors
  const [errors, setErrors] = useState({})
  
  // Quick-fill demo account
  const handleSelectDemoAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password,
    })
    setErrors({})
    if (error) clearError()
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
    
    // Clear API error on change
    if (error) {
      clearError()
    }
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      navigate('/dashboard')
    }
  }
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])
  
  return (
    <Card className="login-form__card" padding="large">
      <div className="login-form__header">
        <h2 className="login-form__title">Portal Login</h2>
        <p className="login-form__subtitle">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="login-form__demo-bar">
        <p className="login-form__demo-title">Quick Demo Login:</p>
        <div className="login-form__demo-pills">
          {PREDEFINED_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={`login-form__demo-pill ${formData.email === acc.email ? 'login-form__demo-pill--active' : ''}`}
              onClick={() => handleSelectDemoAccount(acc)}
              title={`${acc.description} (${acc.email})`}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        {/* API Error */}
        {error && (
          <div className="login-form__error" role="alert">
            {error}
          </div>
        )}
        
        {/* Email Field */}
        <Input
          type="email"
          name="email"
          label="Email Address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          disabled={loading}
          autoComplete="email"
        />
        
        {/* Password Field */}
        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          disabled={loading}
          autoComplete="current-password"
        />
        
        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Sign In
        </Button>
      </form>
      
      <div className="login-form__footer">
        <p className="login-form__help-text">
          Don't have an account?{' '}
          <Link to="/signup" className="login-form__link">
            Create account
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default LoginForm
