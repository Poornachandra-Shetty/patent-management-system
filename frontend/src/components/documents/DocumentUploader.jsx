/**
 * DocumentUploader Component
 * File upload with drag-and-drop, validation, and progress
 */

import { useState, useRef } from 'react'
import { Button, Card } from '../common'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../utils/constants'
import { uploadDocument, validateFile } from '../../services/documentService'
import './DocumentUploader.css'

function DocumentUploader({ 
  applicationId, 
  onUploadSuccess,
  existingDocuments = [],
  disabled = false 
}) {
  const fileInputRef = useRef(null)
  
  // State
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedType, setSelectedType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  // Get uploaded document types
  const uploadedTypes = existingDocuments.map(doc => doc.doc_type)
  
  // Check if document type already uploaded
  const isTypeUploaded = (type) => uploadedTypes.includes(type)

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error)
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error)
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      setError('Please select a file and document type')
      return
    }

    if (isTypeUploaded(selectedType)) {
      setError('This document type has already been uploaded')
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    const result = await uploadDocument(
      applicationId,
      selectedType,
      selectedFile,
      setProgress
    )

    setUploading(false)

    if (result.success) {
      setSelectedFile(null)
      setSelectedType('')
      if (onUploadSuccess) {
        onUploadSuccess(result.data)
      }
    } else {
      setError(result.error)
    }
  }

  // Trigger file input
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Clear selected file
  const clearSelection = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="document-uploader" padding="large">
      <h3 className="document-uploader__title">Upload Documents</h3>
      <p className="document-uploader__subtitle">
        Upload required documents for your patent application
      </p>

      {/* Document Type Selector */}
      <div className="document-uploader__type-selector">
        <label className="document-uploader__label">Document Type</label>
        <select
          className="document-uploader__select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={disabled || uploading}
        >
          <option value="">Select document type</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
            <option 
              key={type} 
              value={type}
              disabled={isTypeUploaded(type)}
            >
              {label} {isTypeUploaded(type) ? '(Already uploaded)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        className={`document-uploader__dropzone ${dragOver ? 'document-uploader__dropzone--active' : ''} ${disabled ? 'document-uploader__dropzone--disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="document-uploader__input"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        
        {selectedFile ? (
          <div className="document-uploader__selected">
            <div className="document-uploader__file-icon">📄</div>
            <div className="document-uploader__file-info">
              <span className="document-uploader__file-name">{selectedFile.name}</span>
              <span className="document-uploader__file-size">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              className="document-uploader__clear"
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              type="button"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="document-uploader__placeholder">
            <div className="document-uploader__icon">📁</div>
            <p>Drag and drop a file here, or click to browse</p>
            <span className="document-uploader__hint">
              Accepted formats: PDF, DOC, DOCX (max 10MB)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="document-uploader__progress">
          <div className="document-uploader__progress-bar">
            <div 
              className="document-uploader__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="document-uploader__progress-text">{progress}%</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="document-uploader__error" role="alert">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="document-uploader__actions">
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || !selectedType || uploading || disabled}
          loading={uploading}
        >
          Upload Document
        </Button>
      </div>
    </Card>
  )
}

export default DocumentUploader
