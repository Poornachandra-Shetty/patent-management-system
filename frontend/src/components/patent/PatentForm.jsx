/**
 * PatentForm Component
 * Multi-field form for patent application submission
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../common'
import { DEPARTMENTS, PATENT_CATEGORIES } from '../../utils/constants'
import { createPatent } from '../../services/patentService'
import './PatentForm.css'

function PatentForm() {
  const navigate = useNavigate()
  
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
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle submit
  const handleSubmit = async (status = 'draft') => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    const result = await createPatent({
      ...formData,
      status,
    })
    
    setLoading(false)
    
    if (result.success) {
      // Navigate to patent details
      const patentId = result.data.id || result.data.patent_id
      navigate(`/patents/${patentId}`)
    } else {
      setError(result.error)
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
            placeholder="Enter names and details of all inventors (one per line)"
            value={formData.inventor_details}
            onChange={handleChange}
            disabled={loading}
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
            disabled={loading}
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
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
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
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
