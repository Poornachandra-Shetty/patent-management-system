/**
 * PatentForm Component
 * Multi-field form for patent application submission
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../common'
import { PATENT_CATEGORIES } from '../../utils/constants'
import api, { getErrorMessage } from '../../services/api'
import { createPatent, submitPatent } from '../../services/patentService'
import './PatentForm.css'

function PatentForm() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    inventor_details: '',
    department: '',
    category: '',
    abstract: '',
    keywords: '',
    problem_statement: '',
    novelty_description: '',
    proposed_application: '',
  })
  
  // UI state
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.get('/departments/')
        setDepartments(response.data?.results || [])
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoadingDepartments(false)
      }
    }

    loadDepartments()
  }, [])
  
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
    
    // Clear API error
    if (error) {
      setError(null)
    }
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    // Required field validation
    const requiredFields = [
      { key: 'title', label: 'Patent Title' },
      { key: 'inventor_details', label: 'Inventor Details' },
      { key: 'department', label: 'Department' },
      { key: 'category', label: 'Category' },
      { key: 'abstract', label: 'Abstract' },
      { key: 'keywords', label: 'Keywords' },
      { key: 'problem_statement', label: 'Problem Statement' },
      { key: 'novelty_description', label: 'Novelty Description' },
      { key: 'proposed_application', label: 'Proposed Application' },
    ]
    
    requiredFields.forEach(({ key, label }) => {
      if (!formData[key] || !formData[key].trim()) {
        newErrors[key] = `${label} is required`
      }
    })

    formData.inventor_details.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) return
      const inventorParts = line.split('|')
      if (inventorParts.length !== 2 || !inventorParts[0].trim() || !inventorParts[1].trim()) {
        newErrors.inventor_details = 'Enter each inventor as Name | USN/Employee ID, one per line'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle submit
  const handleSubmit = async (status = 'draft') => {
    if (!validateForm()) {
      return
    }

    if (!departments.length) {
      setError('Departments are unavailable. Please try again later.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const departmentId = Number(formData.department)
      const inventors = formData.inventor_details
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [name, usnOrEmpId] = line.split('|').map((value) => value.trim())
          return {
            name,
            usn_or_emp_id: usnOrEmpId,
            department: departmentId,
            is_primary_inventor: index === 0,
          }
        })

      const result = await createPatent({
        title: formData.title,
        department: departmentId,
        category: formData.category,
        abstract: formData.abstract,
        keywords: formData.keywords,
        problem_statement: formData.problem_statement,
        novelty_description: formData.novelty_description,
        proposed_application: formData.proposed_application,
        inventors,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      const patentId = result.data.id || result.data.patent_id
      if (status === 'submitted') {
        const submitResult = await submitPatent(patentId)
        if (!submitResult.success) {
          window.alert(`Draft saved, but submission failed: ${submitResult.error}`)
        }
      }
      navigate(`/patents/${patentId}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle save draft
  const handleSaveDraft = () => {
    handleSubmit('draft')
  }
  
  // Handle submit for review
  const handleSubmitForReview = () => {
    handleSubmit('submitted')
  }

  return (
    <Card className="patent-form" padding="large">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitForReview(); }}>
        {/* API Error */}
        {error && (
          <div className="patent-form__error" role="alert">
            {error}
          </div>
        )}
        
        {/* Patent Title */}
        <Input
          name="title"
          label="Patent Title"
          placeholder="Enter the title of your patent"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          disabled={loading}
          fullWidth
        />
        
        {/* Inventor Details */}
        <div className="form-group">
          <label className="form-group__label">
            Inventor Details <span className="form-group__required">*</span>
          </label>
          <textarea
            name="inventor_details"
            className={`form-group__textarea ${errors.inventor_details ? 'form-group__textarea--error' : ''}`}
            placeholder="Enter one inventor per line as Name | USN/Employee ID"
            value={formData.inventor_details}
            onChange={handleChange}
            disabled={loading || loadingDepartments}
            rows={4}
          />
          {errors.inventor_details && (
            <p className="form-group__error">{errors.inventor_details}</p>
          )}
        </div>
        
        {/* Department */}
        <div className="form-group">
          <label className="form-group__label">
            Department <span className="form-group__required">*</span>
          </label>
          <select
            name="department"
            className={`form-group__select ${errors.department ? 'form-group__select--error' : ''}`}
            value={formData.department}
            onChange={handleChange}
            disabled={loading || loadingDepartments}
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          {errors.department && (
            <p className="form-group__error">{errors.department}</p>
          )}
        </div>
        
        {/* Category */}
        <div className="form-group">
          <label className="form-group__label">
            Category of Patent <span className="form-group__required">*</span>
          </label>
          <select
            name="category"
            className={`form-group__select ${errors.category ? 'form-group__select--error' : ''}`}
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select Category</option>
            {PATENT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="form-group__error">{errors.category}</p>
          )}
        </div>
        
        {/* Abstract */}
        <div className="form-group">
          <label className="form-group__label">
            Abstract <span className="form-group__required">*</span>
          </label>
          <textarea
            name="abstract"
            className={`form-group__textarea ${errors.abstract ? 'form-group__textarea--error' : ''}`}
            placeholder="Brief summary of the invention (max 500 words)"
            value={formData.abstract}
            onChange={handleChange}
            disabled={loading}
            rows={5}
          />
          {errors.abstract && (
            <p className="form-group__error">{errors.abstract}</p>
          )}
        </div>
        
        {/* Keywords */}
        <Input
          name="keywords"
          label="Keywords"
          placeholder="Enter keywords separated by commas (e.g., machine learning, automation, manufacturing)"
          value={formData.keywords}
          onChange={handleChange}
          error={errors.keywords}
          required
          disabled={loading}
          fullWidth
        />
        
        {/* Problem Statement */}
        <div className="form-group">
          <label className="form-group__label">
            Problem Statement <span className="form-group__required">*</span>
          </label>
          <textarea
            name="problem_statement"
            className={`form-group__textarea ${errors.problem_statement ? 'form-group__textarea--error' : ''}`}
            placeholder="Describe the problem your invention solves"
            value={formData.problem_statement}
            onChange={handleChange}
            disabled={loading}
            rows={5}
          />
          {errors.problem_statement && (
            <p className="form-group__error">{errors.problem_statement}</p>
          )}
        </div>
        
        {/* Novelty Description */}
        <div className="form-group">
          <label className="form-group__label">
            Novelty Description <span className="form-group__required">*</span>
          </label>
          <textarea
            name="novelty_description"
            className={`form-group__textarea ${errors.novelty_description ? 'form-group__textarea--error' : ''}`}
            placeholder="What is novel/unique about your invention?"
            value={formData.novelty_description}
            onChange={handleChange}
            disabled={loading}
            rows={5}
          />
          {errors.novelty_description && (
            <p className="form-group__error">{errors.novelty_description}</p>
          )}
        </div>
        
        {/* Proposed Application */}
        <div className="form-group">
          <label className="form-group__label">
            Proposed Application <span className="form-group__required">*</span>
          </label>
          <textarea
            name="proposed_application"
            className={`form-group__textarea ${errors.proposed_application ? 'form-group__textarea--error' : ''}`}
            placeholder="Describe potential applications and uses of the invention"
            value={formData.proposed_application}
            onChange={handleChange}
            disabled={loading}
            rows={5}
          />
          {errors.proposed_application && (
            <p className="form-group__error">{errors.proposed_application}</p>
          )}
        </div>
        
        {/* Form Actions */}
        <div className="patent-form__actions">
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={handleSaveDraft}
            disabled={loading || loadingDepartments || !departments.length}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading || loadingDepartments || !departments.length}
          >
            Submit for Review
          </Button>
        </div>
        
        <p className="patent-form__help">
          You can save this application as a draft and submit later. 
          Documents can be uploaded after creating the application.
        </p>
      </form>
    </Card>
  )
}

export default PatentForm
