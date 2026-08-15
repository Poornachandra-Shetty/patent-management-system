/**
 * DocumentsPage
 * Page for uploading and managing patent documents
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Container, Card, Button } from '../components/common'
import { DocumentUploader, DocumentList } from '../components/documents'
import { getPatentById } from '../services/patentService'
import { getDocuments } from '../services/documentService'
import './DocumentsPage.css'

function DocumentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State
  const [patent, setPatent] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch patent and documents
  useEffect(() => {
    fetchData()
  }, [id])
  
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    // Fetch patent details
    const patentResult = await getPatentById(id)
    
    if (!patentResult.success) {
      setError(patentResult.error)
      setLoading(false)
      return
    }
    
    setPatent(patentResult.data)
    
    // Fetch documents
    const docsResult = await getDocuments(id)
    
    if (docsResult.success) {
      setDocuments(docsResult.data || [])
    }
    
    setLoading(false)
  }
  
  // Handle upload success
  const handleUploadSuccess = (newDocument) => {
    setDocuments(prev => [...prev, newDocument])
  }
  
  // Handle document deleted
  const handleDocumentDeleted = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }
  
  // Check if can upload (draft status only)
  const canUpload = patent?.status === 'draft'
  
  // Loading state
  if (loading) {
    return (
      <div className="documents-page">
        <Container>
          <div className="documents-page__loading">
            <div className="documents-page__spinner"></div>
            <p>Loading...</p>
          </div>
        </Container>
      </div>
    )
  }
  
  // Error state
  if (error || !patent) {
    return (
      <div className="documents-page">
        <Container>
          <Card className="documents-page__error" padding="large">
            <h2>Patent Not Found</h2>
            <p>{error || 'Unable to load patent details'}</p>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </Container>
      </div>
    )
  }
  
  return (
    <div className="documents-page">
      <Container>
        {/* Breadcrumb */}
        <div className="documents-page__breadcrumb">
          <Link to="/dashboard" className="documents-page__breadcrumb-link">
            Dashboard
          </Link>
          <span className="documents-page__breadcrumb-separator">/</span>
          <Link 
            to={`/patents/${id}`} 
            className="documents-page__breadcrumb-link"
          >
            {patent.patent_id || `Patent #${id}`}
          </Link>
          <span className="documents-page__breadcrumb-separator">/</span>
          <span className="documents-page__breadcrumb-current">Documents</span>
        </div>
        
        {/* Page Header */}
        <div className="documents-page__header">
          <div>
            <h1 className="documents-page__title">Document Upload</h1>
            <p className="documents-page__subtitle">
              Upload required documents for: <strong>{patent.title}</strong>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/patents/${id}`)}
          >
            Back to Patent
          </Button>
        </div>
        
        {/* Info Banner */}
        {!canUpload && (
          <Card className="documents-page__info" padding="medium">
            <p>
              ⚠️ Documents can only be uploaded for draft applications. 
              This application is currently <strong>{patent.status}</strong>.
            </p>
          </Card>
        )}
        
        {/* Document Uploader */}
        <DocumentUploader
          applicationId={id}
          existingDocuments={documents}
          onUploadSuccess={handleUploadSuccess}
          disabled={!canUpload}
        />
        
        {/* Document List */}
        <DocumentList
          documents={documents}
          applicationId={id}
          onDocumentDeleted={handleDocumentDeleted}
          canDelete={canUpload}
        />
        
        {/* Help Section */}
        <Card className="documents-page__help" padding="medium">
          <h3>Document Requirements</h3>
          <ul>
            <li><strong>Supporting Documents:</strong> Additional documents supporting your patent application</li>
            <li><strong>Patent Form:</strong> The completed patent application form</li>
            <li><strong>NDA:</strong> Signed Non-Disclosure Agreement</li>
          </ul>
          <p>All documents must be in PDF, DOC, or DOCX format. Maximum file size: 10MB</p>
        </Card>
      </Container>
    </div>
  )
}

export default DocumentsPage
