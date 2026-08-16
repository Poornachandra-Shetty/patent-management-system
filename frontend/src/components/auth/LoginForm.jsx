/**
 * LoginForm Component
 * Login form with email and password fields
 * Handles validation and submission
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Card } from '../common'
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
        <h2 className="login-form__title">Applicant Login</h2>
        <p className="login-form__subtitle">
          Sign in to access your patent applications
        </p>
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
          <a href="/signup" className="login-form__link">
            Contact administrator
          </a>
        </p>
      </div>
    </Card>
  )
}

export default LoginForm
