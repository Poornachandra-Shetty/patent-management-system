/**
 * RegisterForm Component
 * Public signup form for SJEC applicants.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../services/api'
import { Button, Card, Input } from '../common'
import './RegisterForm.css'

const initialFormData = {
  name: '',
  email: '',
  password: '',
  usn_or_emp_id: '',
  mobile: '',
  department: '',
}

function RegisterForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormData)
  const [departments, setDepartments] = useState([])
  const [errors, setErrors] = useState({})
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.get('/departments/')
        const list = response.data?.results || response.data || []
        setDepartments(list)
      } catch (error) {
        setServerError(getErrorMessage(error))
      } finally {
        setLoadingDepartments(false)
      }
    }

    loadDepartments()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }

    if (serverError) {
      setServerError('')
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) || !formData.email.endsWith('@sjec.ac.in')) {
      nextErrors.email = 'Use a valid @sjec.ac.in email address'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.usn_or_emp_id.trim()) {
      nextErrors.usn_or_emp_id = 'USN / Employee ID is required'
    }

    if (!formData.mobile.trim()) {
      nextErrors.mobile = 'Mobile number is required'
    }

    if (!formData.department) {
      nextErrors.department = 'Department is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await api.post('/auth/register/', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        usn_or_emp_id: formData.usn_or_emp_id,
        mobile: formData.mobile,
        department: Number(formData.department),
      })

      navigate('/login')
    } catch (error) {
      setServerError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="register-form__card" padding="large">
      <div className="register-form__header">
        <h2 className="register-form__title">Create Account</h2>
        <p className="register-form__subtitle">
          Register with your SJEC email and department details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="register-form" noValidate>
        {serverError && (
          <div className="register-form__error" role="alert">
            {serverError}
          </div>
        )}

        <div className="register-form__grid">
          <Input
            type="text"
            name="name"
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            disabled={submitting || loadingDepartments}
          />

          <Input
            type="email"
            name="email"
            label="SJEC Email"
            placeholder="student@sjec.ac.in"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={submitting || loadingDepartments}
            autoComplete="email"
          />

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            disabled={submitting || loadingDepartments}
            autoComplete="new-password"
          />

          <Input
            type="text"
            name="usn_or_emp_id"
            label="USN / Employee ID"
            placeholder="USN or Employee ID"
            value={formData.usn_or_emp_id}
            onChange={handleChange}
            error={errors.usn_or_emp_id}
            required
            disabled={submitting || loadingDepartments}
          />

          <Input
            type="tel"
            name="mobile"
            label="Mobile Number"
            placeholder="Enter your mobile number"
            value={formData.mobile}
            onChange={handleChange}
            error={errors.mobile}
            required
            disabled={submitting || loadingDepartments}
            autoComplete="tel"
          />

          <div className="register-form__field">
            <label htmlFor="department" className="register-form__label">
              Department
              <span className="register-form__required" aria-hidden="true">*</span>
            </label>
            <div className={`register-form__select-wrapper ${errors.department ? 'register-form__select-wrapper--error' : ''}`}>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={submitting || loadingDepartments}
                className="register-form__select"
                aria-invalid={errors.department ? 'true' : 'false'}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.department && (
              <p className="register-form__error-text" role="alert">{errors.department}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={submitting}
          disabled={submitting || loadingDepartments}
        >
          Create Account
        </Button>
      </form>

      <div className="register-form__footer">
        <p className="register-form__help-text">
          Already have an account?{' '}
          <Link to="/login" className="register-form__link">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default RegisterForm
