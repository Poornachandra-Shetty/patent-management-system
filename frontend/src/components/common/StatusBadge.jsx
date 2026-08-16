/**
 * StatusBadge Component
 * Displays patent status with appropriate color
 */

import { PATENT_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../utils/constants'
import './StatusBadge.css'

function StatusBadge({ status, size = 'medium', className = '' }) {
  const label = STATUS_LABELS[status] || status
  const color = STATUS_COLORS[status] || STATUS_COLORS[PATENT_STATUS.DRAFT]
  
  return (
    <span 
      className={`status-badge status-badge--${size} ${className}`}
      style={{ 
        '--badge-color': color,
        '--badge-bg': `${color}15`
      }}
    >
      {label}
    </span>
  )
}

export default StatusBadge
