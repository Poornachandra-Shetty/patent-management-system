/**
 * PatentDetailsPage
 * Page to view and manage a single patent application
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Container, Button, Card, Modal, Toast } from '../components/common'
import { PatentDetails } from '../components/patent'
import { RemarksList } from '../components/remarks'
import { getPatentById, submitPatent } from '../services/patentService'
import * as documentService from '../services/documentService'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../utils/constants'
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

  // Upload Report Modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [reportFile, setReportFile] = useState(null)
  const [uploadingReport, setUploadingReport] = useState(false)
  
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
  
  // Handle upload documents
  const handleUploadDocuments = () => {
    setShowUploadModal(true)
  }

  // Handle quick report upload
  const handleUploadReportSubmit = async (e) => {
    e.preventDefault()
    if (!reportFile) {
      showToast('Please select a PDF file.', 'warning')
      return
    }

    setUploadingReport(true)
    const res = await documentService.uploadDocument(
      id,
      DOCUMENT_TYPES.APPLICANT_PATENT_REPORT,
      reportFile
    )

    setUploadingReport(false)
    if (res.success) {
      showToast('Patent report uploaded successfully!', 'success')
      setShowUploadModal(false)
      setReportFile(null)
      fetchDocuments()
    } else {
      showToast(res.error || 'Failed to upload report.', 'error')
    }
  }
  
  // Handle submit for review
  const handleSubmit = async () => {
    if (!hasApplicantReport) {
      showToast('Mandatory Applicant Patent Report (PDF) is required before submitting.', 'warning')
      setShowUploadModal(true)
      return
    }

    if (!window.confirm('Are you sure you want to submit this patent for review? Once submitted, technical disclosures are locked for evaluation.')) {
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

        {/* Mandatory Document Notice for Drafts */}
        {patent?.status === 'draft' && (
          <div style={{
            background: hasApplicantReport ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${hasApplicantReport ? '#6ee7b7' : '#fcd34d'}`,
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
              <p style={{ margin: '0 0 4px', fontWeight: '700', color: hasApplicantReport ? '#065f46' : '#92400e' }}>
                {hasApplicantReport
                  ? '✓ Mandatory Patent Report Attached'
                  : '⚠️ Action Required: Mandatory Patent Report PDF Missing'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: hasApplicantReport ? '#047857' : '#b45309' }}>
                {hasApplicantReport
                  ? 'Your technical disclosure report PDF is attached. You may now submit your patent for consultant evaluation.'
                  : 'A mandatory PDF patent report must be uploaded before submitting this application for consultant review.'}
              </p>
            </div>
            <Button
              variant={hasApplicantReport ? 'secondary' : 'primary'}
              size="small"
              onClick={() => setShowUploadModal(true)}
            >
              {hasApplicantReport ? 'Replace / Upload Documents' : 'Upload Patent Report PDF'}
            </Button>
          </div>
        )}
        
        {/* Patent Details */}
        <PatentDetails
          patent={patent}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onUploadDocuments={handleUploadDocuments}
        />

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="patent-details-page__section">
            <Card title={`Application Documents (${documents.length})`} padding="large">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.88rem'
                    }}
                  >
                    <div>
                      <strong>{DOCUMENT_TYPE_LABELS[doc.doc_type] || doc.doc_type}</strong>
                      <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '0.78rem' }}>
                        Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.file && (
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#2563eb',
                          fontWeight: '600',
                          fontSize: '0.82rem',
                          textDecoration: 'none'
                        }}
                      >
                        Download PDF ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Remarks Section */}
        <div className="patent-details-page__section">
          <RemarksList applicationId={id} />
        </div>

        {/* Upload Report Modal */}
        {showUploadModal && (
          <Modal
            title="Upload Applicant Patent Report (PDF)"
            onClose={() => !uploadingReport && setShowUploadModal(false)}
          >
            <form onSubmit={handleUploadReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                Please select your complete technical patent report or disclosure document in PDF format.
              </p>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setReportFile(e.target.files[0])}
                style={{
                  padding: '10px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  background: '#f8fafc'
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadingReport}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={uploadingReport}
                  disabled={uploadingReport}
                >
                  Upload Report
                </Button>
              </div>
            </form>
          </Modal>
        )}
        
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
