/**
 * FilterPanel Component
 * Filters for patent list (status, department, search)
 */

import { useState, useEffect } from 'react'
import './FilterPanel.css'
import { PATENT_STATUS, STATUS_LABELS } from '../../utils/constants'

function FilterPanel({ onFilter, loading = false, departments = [] }) {
  const [status, setStatus] = useState('submitted')
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
    setStatus('submitted')
    setDepartment('')
    setSearch('')
    onFilter({
      status: 'submitted',
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
            <option value="">All</option>
            <option value={PATENT_STATUS.SUBMITTED}>
              {STATUS_LABELS[PATENT_STATUS.SUBMITTED]}
            </option>
            <option value={PATENT_STATUS.UNDER_SCRUTINY}>
              {STATUS_LABELS[PATENT_STATUS.UNDER_SCRUTINY]}
            </option>
            <option value={PATENT_STATUS.FORWARDED_TO_CONSULTANT}>
              {STATUS_LABELS[PATENT_STATUS.FORWARDED_TO_CONSULTANT]}
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
