/**
 * FilterPanel Component
 * Filters for patent list (status, department, search)
 */

import { useState, useEffect } from 'react'
import './FilterPanel.css'
import { PATENT_STATUS, STATUS_LABELS } from '../../utils/constants'

function FilterPanel({ onFilter, loading = false, departments = [] }) {
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onFilter({
      status,
      department,
      search,
    })
  }

  const handleReset = () => {
    setStatus('')
    setDepartment('')
    setSearch('')
    onFilter({
      status: '',
      department: '',
      search: '',
    })
  }

  return (
    <form className="filter-panel" onSubmit={handleSearch}>
      <div className="filter-panel__row">
        <div className="filter-panel__group">
          <label htmlFor="status-filter" className="filter-panel__label">
            Status
          </label>
          <select
            id="status-filter"
            className="filter-panel__select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
          >
            <option value="">All Statuses</option>
            <option value={PATENT_STATUS.DRAFT}>
              {STATUS_LABELS[PATENT_STATUS.DRAFT] || 'Draft'}
            </option>
            <option value={PATENT_STATUS.SUBMITTED}>
              {STATUS_LABELS[PATENT_STATUS.SUBMITTED]}
            </option>
            <option value={PATENT_STATUS.UNDER_CONSULTANT_REVIEW}>
              {STATUS_LABELS[PATENT_STATUS.UNDER_CONSULTANT_REVIEW] || 'Under Consultant Review'}
            </option>
            <option value={PATENT_STATUS.UNDER_REVIEW_TEAM}>
              {STATUS_LABELS[PATENT_STATUS.UNDER_REVIEW_TEAM] || 'Under Review Team'}
            </option>
            <option value={PATENT_STATUS.PENDING_FINAL_APPROVAL}>
              {STATUS_LABELS[PATENT_STATUS.PENDING_FINAL_APPROVAL] || 'Pending Final Approval'}
            </option>
            <option value={PATENT_STATUS.APPROVED}>
              {STATUS_LABELS[PATENT_STATUS.APPROVED]}
            </option>
            <option value={PATENT_STATUS.REJECTED}>
              {STATUS_LABELS[PATENT_STATUS.REJECTED]}
            </option>
          </select>
        </div>

        <div className="filter-panel__group">
          <label htmlFor="department-filter" className="filter-panel__label">
            Department
          </label>
          <select
            id="department-filter"
            className="filter-panel__select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={loading}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id || dept.name} value={dept.id || dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group">
          <label htmlFor="search-filter" className="filter-panel__label">
            Search
          </label>
          <input
            id="search-filter"
            type="text"
            className="filter-panel__input"
            placeholder="Title or Applicant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="filter-panel__actions">
        <button
          type="submit"
          className="filter-panel__button filter-panel__button--primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          className="filter-panel__button filter-panel__button--secondary"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </button>
      </div>
    </form>
  )
}

export default FilterPanel
