/**
 * PatentDetailsPage
 * Page to view and manage a single patent application
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Container, Button, Card } from '../components/common'
import { PatentDetails } from '../components/patent'
import { RemarksList } from '../components/remarks'
import { getPatentById, submitPatent } from '../services/patentService'
import './PatentDetailsPage.css'

function PatentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State
  const [patent, setPatent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Fetch patent on mount
  useEffect(() => {
    fetchPatent()
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
  
  // Handle edit
  const handleEdit = () => {
    navigate(`/patents/${id}/edit`)
  }
  
  // Handle upload documents
  const handleUploadDocuments = () => {
    navigate(`/patents/${id}/documents`)
  }
  
  // Handle submit for review
  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this patent for review? Once submitted, you cannot make changes.')) {
      return
    }
    
    setSubmitting(true)
    
    const result = await submitPatent(id)
    
    setSubmitting(false)
    
    if (result.success) {
      // Update local patent state
      setPatent(prev => ({
        ...prev,
        status: 'submitted',
      }))
      // Or refetch
      fetchPatent()
    } else {
      alert('Failed to submit: ' + result.error)
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
        
        {/* Patent Details */}
        <PatentDetails
          patent={patent}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onUploadDocuments={handleUploadDocuments}
        />

        {/* Remarks Section */}
        <div className="patent-details-page__section">
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
