/**
 * RemarksList Component
 * Displays reviewer remarks for a patent application
 */

import { useState, useEffect } from 'react'
import { Card, Button } from '../common'
import { getRemarks } from '../../services/reviewService'
import './RemarksList.css'

function RemarksList({ applicationId }) {
  const [remarks, setRemarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch remarks
  useEffect(() => {
    fetchRemarks()
  }, [applicationId])

  const fetchRemarks = async () => {
    setLoading(true)
    setError(null)

    const result = await getRemarks(applicationId)

    if (result.success) {
      // Handle array response or object with remarks array
      const remarksData = result.data.remarks || result.data || []
      setRemarks(Array.isArray(remarksData) ? remarksData : [])
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  // Format date
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

  // Loading state
  if (loading) {
    return (
      <Card className="remarks-list remarks-list--loading" padding="large">
        <div className="remarks-list__loader">
          <div className="remarks-list__spinner"></div>
          <p>Loading remarks...</p>
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="remarks-list remarks-list--error" padding="medium">
        <div className="remarks-list__error">
          <p>Failed to load remarks: {error}</p>
          <Button variant="secondary" size="small" onClick={fetchRemarks}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  // Empty state
  if (remarks.length === 0) {
    return (
      <Card className="remarks-list remarks-list--empty" padding="large">
        <div className="remarks-list__empty">
          <div className="remarks-list__empty-icon">💬</div>
          <h3>No Remarks Yet</h3>
          <p>Remarks from reviewers will appear here once your application is reviewed.</p>
        </div>
      </Card>
    )
  }

  // List of remarks
  return (
    <Card className="remarks-list" padding="large">
      <h3 className="remarks-list__title">Review Remarks</h3>
      <p className="remarks-list__subtitle">
        Feedback from the review process
      </p>

      <div className="remarks-list__items">
        {remarks.map((remark, index) => (
          <div key={remark.id || index} className="remark-item">
            <div className="remark-item__header">
              <span className="remark-item__reviewer">
                {remark.reviewer_name || remark.user_name || 'Reviewer'}
              </span>
              <span className="remark-item__date">
                {formatDate(remark.created_at)}
              </span>
            </div>
            <p className="remark-item__text">{remark.text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RemarksList
