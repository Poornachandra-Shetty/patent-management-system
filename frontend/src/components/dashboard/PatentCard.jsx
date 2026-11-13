/**
 * PatentCard Component
 * Displays a summary of a patent application
 */

import { Link } from 'react-router-dom'
import { Card, StatusBadge } from '../common'
import { STATUS_LABELS } from '../../utils/constants'
import './PatentCard.css'

function PatentCard({ patent }) {
  const {
    id,
    patent_id,
    title,
    status,
    department,
    department_detail,
    created_at,
  } = patent

  const deptName = department_detail?.name || (typeof department === 'object' ? department?.name : department) || 'Department'

  // Format date
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <div className="patent-card">
      <Link to={`/patents/${id}`} className="patent-card__link">
        <div className="patent-card__header">
          <span className="patent-card__id">{patent_id || `#${id}`}</span>
          <StatusBadge status={status} size="small" />
        </div>
        
        <h3 className="patent-card__title" title={title}>{title}</h3>
        
        <div className="patent-card__meta">
          <span className="patent-card__department" title={deptName}>
            {deptName}
          </span>
          <span className="patent-card__date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {formattedDate}
          </span>
        </div>
        
        <div className="patent-card__action">
          <span className="patent-card__view-btn">
            View Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </Link>
    </div>
  )
}

export default PatentCard
