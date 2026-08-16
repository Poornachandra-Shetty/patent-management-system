/**
 * DocumentList Component
 * Displays list of uploaded documents
 */

import { useState } from 'react'
import { Card, Button } from '../common'
import { DOCUMENT_TYPE_LABELS } from '../../utils/constants'
import { deleteDocument } from '../../services/documentService'
import './DocumentList.css'

function DocumentList({ 
  documents = [], 
  applicationId,
  onDocumentDeleted,
  canDelete = false 
}) {
  const [deleting, setDeleting] = useState(null)

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Handle delete
  const handleDelete = async (documentId, docType) => {
    if (!window.confirm(`Are you sure you want to delete this ${DOCUMENT_TYPE_LABELS[docType] || 'document'}?`)) {
      return
    }

    setDeleting(documentId)
    
    const result = await deleteDocument(documentId)
    
    setDeleting(null)
    
    if (result.success) {
      if (onDocumentDeleted) {
        onDocumentDeleted(documentId)
      }
    } else {
      alert('Failed to delete: ' + result.error)
    }
  }

  // Get file icon based on type
  const getFileIcon = (filename) => {
    if (!filename) return '📄'
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📕'
    if (ext === 'doc' || ext === 'docx') return '📘'
    return '📄'
  }

  if (documents.length === 0) {
    return (
      <Card className="document-list document-list--empty" padding="large">
        <div className="document-list__empty">
          <div className="document-list__empty-icon">📁</div>
          <p>No documents uploaded yet</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="document-list">
      <h3 className="document-list__title">Uploaded Documents</h3>
      
      <div className="document-list__items">
        {documents.map((doc) => (
          <Card key={doc.id} className="document-item" padding="medium">
            <div className="document-item__icon">
              {getFileIcon(doc.file_url)}
            </div>
            
            <div className="document-item__info">
              <span className="document-item__type">
                {DOCUMENT_TYPE_LABELS[doc.doc_type] || doc.doc_type}
              </span>
              <span className="document-item__date">
                Uploaded: {formatDate(doc.uploaded_at)}
              </span>
            </div>
            
            <div className="document-item__actions">
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="document-item__download"
              >
                <Button variant="ghost" size="small">
                  View
                </Button>
              </a>
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleDelete(doc.id, doc.doc_type)}
                  disabled={deleting === doc.id}
                  className="document-item__delete"
                >
                  {deleting === doc.id ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DocumentList
