/**
 * RemarkCard Component
 * Displays a single remark/review with metadata
 */

import './RemarkCard.css'
import { REVIEW_VISIBILITY_LABELS } from '../../utils/constants'

function RemarkCard({ remark }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="remark-card">
      <div className="remark-card__header">
        <div className="remark-card__meta">
          <h4 className="remark-card__reviewer">{remark.reviewer_name || 'Unknown Reviewer'}</h4>
          <span className="remark-card__role">{remark.reviewer_role || 'Reviewer'}</span>
        </div>
        <div className="remark-card__info">
          <time className="remark-card__date" dateTime={remark.created_at}>
            {formatDate(remark.created_at)}
          </time>
          <span className={`remark-card__visibility remark-card__visibility--${remark.visibility}`}>
            {REVIEW_VISIBILITY_LABELS[remark.visibility] || remark.visibility}
          </span>
        </div>
      </div>
      <div className="remark-card__content">
        <p className="remark-card__text">{remark.remark}</p>
      </div>
      {remark.status_after && (
        <div className="remark-card__status">
          <span className="remark-card__status-label">Status after remark:</span>
          <span className="remark-card__status-value">{remark.status_after}</span>
        </div>
      )}
    </div>
  )
}

export default RemarkCard
