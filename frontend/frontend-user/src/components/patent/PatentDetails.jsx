/**
 * PatentDetails Component
 * Displays full patent information
 */

import { Card, StatusBadge, Button } from '../common'
import { STATUS_LABELS } from '../../utils/constants'
import './PatentDetails.css'

function PatentDetails({ patent, onEdit, onSubmit, onUploadDocuments }) {
  if (!patent) {
    return null
  }

  const {
    patent_id,
    title,
    inventor_details,
    department,
    category,
    abstract,
    keywords,
    problem_statement,
    novelty_description,
    proposed_application,
    status,
    created_at,
    updated_at,
  } = patent

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if patent is editable (draft status only)
  const isEditable = status === 'draft'
  const canSubmit = status === 'draft'
  const canUploadDocuments = status === 'draft'

  return (
    <div className="patent-details">
      {/* Header */}
      <Card className="patent-details__header" padding="large">
        <div className="patent-details__header-top">
          <div className="patent-details__meta">
            <span className="patent-details__patent-id">{patent_id || 'Pending Assignment'}</span>
            <StatusBadge status={status} size="large" />
          </div>
          <h1 className="patent-details__title">{title}</h1>
        </div>
        
        <div className="patent-details__timestamps">
          <span>Created: {formatDate(created_at)}</span>
          <span>•</span>
          <span>Last Updated: {formatDate(updated_at)}</span>
        </div>
      </Card>

      {/* Main Content */}
      <div className="patent-details__content">
        {/* Basic Info */}
        <Card title="Basic Information" className="patent-details__section">
          <div className="patent-details__grid">
            <div className="patent-details__field">
              <label>Department</label>
              <p>{department || 'Not specified'}</p>
            </div>
            <div className="patent-details__field">
              <label>Category</label>
              <p>{category || 'Not specified'}</p>
            </div>
            <div className="patent-details__field">
              <label>Keywords</label>
              <p>{keywords || 'Not specified'}</p>
            </div>
          </div>
        </Card>

        {/* Inventor Details */}
        <Card title="Inventor Details" className="patent-details__section">
          <p className="patent-details__text">{inventor_details || 'Not provided'}</p>
        </Card>

        {/* Abstract */}
        <Card title="Abstract" className="patent-details__section">
          <p className="patent-details__text">{abstract || 'Not provided'}</p>
        </Card>

        {/* Problem Statement */}
        <Card title="Problem Statement" className="patent-details__section">
          <p className="patent-details__text">{problem_statement || 'Not provided'}</p>
        </Card>

        {/* Novelty Description */}
        <Card title="Novelty Description" className="patent-details__section">
          <p className="patent-details__text">{novelty_description || 'Not provided'}</p>
        </Card>

        {/* Proposed Application */}
        <Card title="Proposed Application" className="patent-details__section">
          <p className="patent-details__text">{proposed_application || 'Not provided'}</p>
        </Card>
      </div>

      {/* Actions */}
      <Card className="patent-details__actions" padding="large">
        <h3 className="patent-details__actions-title">Actions</h3>
        <div className="patent-details__actions-buttons">
          {isEditable && (
            <Button variant="secondary" onClick={onEdit}>
              Edit Application
            </Button>
          )}
          {canUploadDocuments && (
            <Button variant="secondary" onClick={onUploadDocuments}>
              Upload Documents
            </Button>
          )}
          {canSubmit && (
            <Button variant="primary" onClick={onSubmit}>
              Submit for Review
            </Button>
          )}
          {!isEditable && (
            <p className="patent-details__actions-note">
              This application is under review. No edits can be made.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default PatentDetails
