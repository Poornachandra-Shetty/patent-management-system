/**
 * PatentForm Component
 * Multi-field form for patent application submission
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, X } from 'lucide-react'
import { Button, Input, Card } from '../common'
import { PATENT_CATEGORIES } from '../../utils/constants'
import api, { getErrorMessage } from '../../services/api'
import { createPatent, submitPatent } from '../../services/patentService'
import { uploadDocument } from '../../services/documentService'
import './PatentForm.css'

function PatentForm() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [reportFile, setReportFile] = useState(null)
  
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
      { key: 'inventor_details', label: 'Inventor Names' },
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
  const handleSubmit = async (targetStatus = 'draft') => {
    if (!validateForm()) {
      return
    }

    // Require report document if submitting directly for review
    if (targetStatus === 'submitted' && !reportFile) {
      setErrors(prev => ({
        ...prev,
        reportFile: 'Mandatory Patent Report (PDF) is required to submit for review. You can alternatively save as Draft.',
      }))
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
          let name = line
          let usnOrEmpId = ''
          if (line.includes('|')) {
            const parts = line.split('|').map((v) => v.trim())
            name = parts[0]
            usnOrEmpId = parts[1] || ''
          }
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

      // Upload report file if attached
      if (reportFile) {
        const uploadResult = await uploadDocument(
          patentId,
          'applicant_patent_report',
          reportFile
        )
        if (!uploadResult.success) {
          window.alert(`Patent draft created, but document upload failed: ${uploadResult.error}`)
          navigate(`/patents/${patentId}`)
          return
        }
      }

      // If requested status is 'submitted', perform transition
      if (targetStatus === 'submitted') {
        const submitResult = await submitPatent(patentId)
        if (!submitResult.success) {
          window.alert(`Patent saved with document, but submission transition failed: ${submitResult.error}`)
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
            Inventor / Author Names <span className="form-group__required">*</span>
          </label>
          <textarea
            name="inventor_details"
            className={`form-group__textarea ${errors.inventor_details ? 'form-group__textarea--error' : ''}`}
            placeholder="Enter inventor names (one per line, e.g. Dr. Rajesh Rao, Rahul Sharma)"
            value={formData.inventor_details}
            onChange={handleChange}
            disabled={loading || loadingDepartments}
            rows={3}
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

        {/* Mandatory Patent Report Document (PDF) */}
        <div className="form-group patent-form__upload-section">
          <label className="form-group__label">
            Patent Technical Report (PDF)
            <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: '#64748b' }}>
              (Mandatory for submission, optional for draft)
            </span>
          </label>
          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            background: reportFile ? '#f0fdf4' : '#f8fafc',
            textAlign: 'center',
            transition: 'border-color 0.2s',
          }}>
            <input
              type="file"
              id="patent-report-upload"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                    setErrors(prev => ({ ...prev, reportFile: 'Please upload a valid PDF document.' }))
                    return
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    setErrors(prev => ({ ...prev, reportFile: 'File size must not exceed 10 MB.' }))
                    return
                  }
                  setReportFile(file)
                  setErrors(prev => ({ ...prev, reportFile: '' }))
                }
              }}
              disabled={loading}
            />
            {reportFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <FileText size={22} color="#059669" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: '600', color: '#047857' }}>{reportFile.name}</p>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {(reportFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportFile(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '8px'
                  }}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 8px', color: 'var(--color-text)', fontWeight: '500' }}>
                  Drag & drop or select your Patent Report PDF
                </p>
                <label
                  htmlFor="patent-report-upload"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: '600'
                  }}
                >
                  Choose PDF File
                </label>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Max size: 10 MB. PDF format only.
                </p>
              </div>
            )}
          </div>
          {errors.reportFile && (
            <p className="form-group__error" style={{ marginTop: '6px' }}>{errors.reportFile}</p>
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
