/**
 * useReviews Hook
 * Custom hook for managing reviews/remarks
 */

import { useState, useCallback } from 'react'
import * as adminService from '../services/adminService'

export function useReviews(patentId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Fetch reviews for a patent
  const fetchReviews = useCallback(async () => {
    if (!patentId) return

    setLoading(true)
    setError(null)

    try {
      const response = await adminService.getReviews(patentId)

      if (response.success) {
        // Sort reviews by date
        const sortedReviews = Array.isArray(response.data.results)
          ? response.data.results.sort((a, b) => {
              return new Date(a.created_at) - new Date(b.created_at)
            })
          : []
        setReviews(sortedReviews)
      } else {
        setError(response.error || 'Failed to fetch reviews')
      }
    } catch (err) {
      setError('An error occurred while fetching reviews')
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [patentId])

  // Add a new review
  const addReview = useCallback(async (reviewData) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await adminService.createReview({
        patent: patentId,
        ...reviewData,
      })

      if (response.success) {
        // Refresh reviews list
        await fetchReviews()
        return { success: true, data: response.data }
      } else {
        setSubmitError(response.error || 'Failed to add review')
        return { success: false, error: response.error }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while adding review'
      setSubmitError(errorMsg)
      console.error('Error adding review:', err)
      return { success: false, error: errorMsg }
    } finally {
      setSubmitting(false)
    }
  }, [patentId, fetchReviews])

  return {
    reviews,
    loading,
    error,
    submitting,
    submitError,
    fetchReviews,
    addReview,
  }
}

export default useReviews
