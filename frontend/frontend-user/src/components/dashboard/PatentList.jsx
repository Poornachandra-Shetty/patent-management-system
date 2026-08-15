/**
 * PatentList Component
 * Displays a list of patent cards with loading and empty states
 */

import PatentCard from './PatentCard'
import { Card, Button } from '../common'
import { Link } from 'react-router-dom'
import './PatentList.css'

function PatentList({ 
  patents = [], 
  loading = false, 
  error = null,
  onRetry 
}) {
  // Loading state
  if (loading) {
    return (
      <div className="patent-list patent-list--loading">
        <div className="patent-list__loader">
          <div className="patent-list__spinner"></div>
          <p>Loading your patents...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="patent-list patent-list--error" padding="large">
        <div className="patent-list__error">
          <div className="patent-list__error-icon">⚠️</div>
          <h3 className="patent-list__error-title">Failed to Load Patents</h3>
          <p className="patent-list__error-text">{error}</p>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Empty state
  if (patents.length === 0) {
    return (
      <Card className="patent-list patent-list--empty" padding="large">
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="empty-state__title">No Patent Applications Yet</h3>
          <p className="empty-state__text">
            Start by creating your first patent application. You can save it as a draft and submit when ready.
          </p>
          <Link to="/patents/new">
            <Button variant="primary">
              Create Your First Patent
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // List of patents
  return (
    <div className="patent-list">
      <div className="patent-list__grid">
        {patents.map((patent) => (
          <PatentCard key={patent.id} patent={patent} />
        ))}
      </div>
    </div>
  )
}

export default PatentList
