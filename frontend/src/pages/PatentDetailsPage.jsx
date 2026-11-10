/**
 * PatentDetailsPage
 * Page to view and manage a single patent application
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Container, Button, Card, Toast } from '../components/common'
import { PatentDetails } from '../components/patent'
import { RemarksList } from '../components/remarks'
import { DocumentUploader, DocumentList } from '../components/documents'
import { getPatentById, submitPatent } from '../services/patentService'
import * as documentService from '../services/documentService'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants'
import api from '../services/api'
import './PatentDetailsPage.css'

function PatentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State
  const [patent, setPatent] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Fetch patent and documents on mount
  useEffect(() => {
    fetchPatent()
    fetchDocuments()
  }, [id])
  
  const fetchPatent = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getPatentById(id)
    if (result.success) {
      setPatent(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents/', { params: { application: id } })
      setDocuments(res.data.results || res.data || [])
    } catch (e) {
      console.error('Failed to load documents:', e)
    }
  }

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg)
    setToastType(type)
  }
  
  // Check if mandatory applicant report is uploaded
  const hasApplicantReport = documents.some(d =>
    [
      DOCUMENT_TYPES.APPLICANT_PATENT_REPORT,
      DOCUMENT_TYPES.SUPPORTING_DOCUMENTS,
      DOCUMENT_TYPES.PATENT_FORM,
    ].includes(d.doc_type)
  )

  // Handle edit
  const handleEdit = () => {
    navigate(`/patents/${id}/edit`)
  }
  
  // Handle scroll to upload section
  const handleUploadDocuments = () => {
    const el = document.getElementById('documents-management-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle document uploaded
  const handleDocumentUploaded = (newDoc) => {
    setDocuments(prev => [...prev, newDoc])
    showToast('Document uploaded successfully!', 'success')
  }

  // Handle document deleted
  const handleDocumentDeleted = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId))
    showToast('Document removed.', 'info')
  }
  
  // Handle submit for review
  const handleSubmit = async () => {
    if (!hasApplicantReport) {
      showToast('Mandatory Applicant Patent Report (PDF) is required before submitting.', 'warning')
      handleUploadDocuments()
      return
    }

    if (!window.confirm('Submit this patent for evaluation? Once submitted, technical disclosures are locked for evaluation.')) {
      return
    }
    
    setSubmitting(true)
    const result = await submitPatent(id)
    setSubmitting(false)
    
    if (result.success) {
      showToast('Application successfully submitted for review!', 'success')
      setPatent(prev => ({
        ...prev,
        status: 'submitted',
      }))
      fetchPatent()
    } else {
      showToast('Failed to submit: ' + result.error, 'error')
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="patent-details-page">
        <Container>
          <div className="patent-details-page__loading">
            <div className="patent-details-page__spinner"></div>
            <p>Loading patent details...</p>
          </div>
        </Container>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="patent-details-page">
        <Container>
          <Card className="patent-details-page__error" padding="large">
            <div className="patent-details-page__error-content">
              <h2>Patent Not Found</h2>
              <p>{error}</p>
              <div className="patent-details-page__error-actions">
                <Button variant="primary" onClick={fetchPatent}>
                  Try Again
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </div>
    )
  }

  const isDraft = patent?.status === 'draft'
  
  return (
    <div className="patent-details-page">
      <Container>
        {/* Breadcrumb */}
        <div className="patent-details-page__breadcrumb">
          <Link to="/dashboard" className="patent-details-page__breadcrumb-link">
            Dashboard
          </Link>
          <span className="patent-details-page__breadcrumb-separator">/</span>
          <span className="patent-details-page__breadcrumb-current">
            {patent?.patent_id || `Patent #${id}`}
          </span>
        </div>
        
        {toastMessage && (
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        )}

        {/* Workflow Status Banner for Drafts */}
        {isDraft && (
          <div style={{
            background: hasApplicantReport ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${hasApplicantReport ? '#86efac' : '#fde047'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '700', color: hasApplicantReport ? '#15803d' : '#a16207' }}>
                {hasApplicantReport
                  ? '✓ Technical Report Attached — Ready for Submission'
                  : '⚠️ Action Required: Technical Report (PDF) Missing'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: hasApplicantReport ? '#166534' : '#854d0e' }}>
                {hasApplicantReport
                  ? 'Your patent report is attached. Review the disclosures and submit when ready.'
                  : 'Upload your technical disclosure report PDF in the Documents section below to enable submission.'}
              </p>
            </div>
            {hasApplicantReport && (
              <Button
                variant="primary"
                size="small"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Submit for Review →
              </Button>
            )}
          </div>
        )}
        
        {/* Patent Details */}
        <PatentDetails
          patent={patent}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onUploadDocuments={handleUploadDocuments}
        />

        {/* Dedicated Document Management Section */}
        <div id="documents-management-section" className="patent-details-page__section" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
            Application Documents
          </h2>

          {isDraft && (
            <div style={{ marginBottom: '18px' }}>
              <DocumentUploader
                applicationId={id}
                existingDocuments={documents}
                onUploadSuccess={handleDocumentUploaded}
                allowedDocTypes={[
                  DOCUMENT_TYPES.APPLICANT_PATENT_REPORT,
                  DOCUMENT_TYPES.SUPPORTING_DOCUMENTS,
                  DOCUMENT_TYPES.PATENT_FORM,
                  DOCUMENT_TYPES.NDA,
                ]}
              />
            </div>
          )}

          <DocumentList
            documents={documents}
            applicationId={id}
            onDocumentDeleted={handleDocumentDeleted}
            canDelete={isDraft}
          />
        </div>

        {/* Remarks Section */}
        <div className="patent-details-page__section" style={{ marginTop: '24px' }}>
          <RemarksList applicationId={id} />
        </div>

        {/* Submitting Overlay */}
        {submitting && (
          <div className="patent-details-page__overlay">
            <div className="patent-details-page__overlay-content">
              <div className="patent-details-page__spinner"></div>
              <p>Submitting for review...</p>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

export default PatentDetailsPage
