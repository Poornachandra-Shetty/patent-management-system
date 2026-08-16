/**
 * Pagination Component
 * Handles pagination for lists
 */

import './Pagination.css'

function Pagination({ pagination, onPageChange, loading = false }) {
  if (!pagination) return null

  const { count, page = 1 } = pagination
  const itemsPerPage = 10 // Default, adjust as needed
  const totalPages = Math.ceil(count / itemsPerPage)

  if (totalPages <= 1) return null

  const handlePreviousClick = () => {
    if (page > 1 && !loading) {
      onPageChange(page - 1)
    }
  }

  const handleNextClick = () => {
    if (page < totalPages && !loading) {
      onPageChange(page + 1)
    }
  }

  const handlePageClick = (pageNum) => {
    if (!loading) {
      onPageChange(pageNum)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="pagination">
      <button
        className="pagination__button"
        onClick={handlePreviousClick}
        disabled={page === 1 || loading}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="pagination__pages">
        {pageNumbers[0] > 1 && (
          <>
            <button
              className="pagination__page"
              onClick={() => handlePageClick(1)}
              disabled={loading}
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="pagination__ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            className={`pagination__page ${pageNum === page ? 'pagination__page--active' : ''}`}
            onClick={() => handlePageClick(pageNum)}
            disabled={loading}
            aria-label={`Go to page ${pageNum}`}
            aria-current={pageNum === page ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination__ellipsis">...</span>
            )}
            <button
              className="pagination__page"
              onClick={() => handlePageClick(totalPages)}
              disabled={loading}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="pagination__button"
        onClick={handleNextClick}
        disabled={page === totalPages || loading}
        aria-label="Next page"
      >
        Next →
      </button>

      <span className="pagination__info">
        Page {page} of {totalPages}
      </span>
    </div>
  )
}

export default Pagination
