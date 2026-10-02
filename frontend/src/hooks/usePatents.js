/**
 * usePatents Hook
 * Custom hook for managing patents data
 */

import { useState, useCallback } from 'react'
import * as adminService from '../services/adminService'

export function usePatents() {
  const [patents, setPatents] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: 'submitted',
    department: '',
    search: '',
    page: 1,
  })

  // Fetch patents with current filters
  const fetchPatents = useCallback(async (customFilters = null) => {
    setLoading(true)
    setError(null)

    try {
      const params = customFilters || filters
      const response = await adminService.getPatents(params)

      if (response.success) {
        setPatents(response.data.results || [])
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
        })
        setFilters(params)
      } else {
        setError(response.error || 'Failed to fetch patents')
      }
    } catch (err) {
      setError('An error occurred while fetching patents')
      console.error('Error fetching patents:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Update filters and refetch
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    fetchPatents(updatedFilters)
  }, [filters, fetchPatents])

  // Go to specific page
  const goToPage = useCallback((pageNumber) => {
    const newFilters = { ...filters, page: pageNumber }
    fetchPatents(newFilters)
  }, [filters, fetchPatents])

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      status: 'submitted',
      department: '',
      search: '',
      page: 1,
    }
    setFilters(defaultFilters)
    fetchPatents(defaultFilters)
  }, [fetchPatents])

  return {
    patents,
    pagination,
    loading,
    error,
    filters,
    fetchPatents,
    updateFilters,
    goToPage,
    resetFilters,
  }
}

export default usePatents
