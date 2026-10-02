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
    created_at,
  } = patent

  // Format date
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <Card 
      className="patent-card" 
      hoverable
      padding="medium"
    >
      <Link to={`/patents/${id}`} className="patent-card__link">
        <div className="patent-card__header">
          <span className="patent-card__id">{patent_id || `#${id}`}</span>
          <StatusBadge status={status} size="small" />
        </div>
        
        <h3 className="patent-card__title">{title}</h3>
        
        <div className="patent-card__meta">
          <span className="patent-card__department">{department}</span>
          <span className="patent-card__date">{formattedDate}</span>
        </div>
        
        <div className="patent-card__action">
          <span className="patent-card__view-btn">View Details →</span>
        </div>
      </Link>
    </Card>
  )
}

export default PatentCard
