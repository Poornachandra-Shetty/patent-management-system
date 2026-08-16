/**
 * AdminDashboard Page
 * Displays list of patents with filters and pagination
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatents } from '../hooks/usePatents'
import * as adminService from '../services/adminService'
import { Loader, Toast, FilterPanel, Pagination } from '../components/common'
import './AdminDashboard.css'
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants'

function AdminDashboard() {
  const navigate = useNavigate()
  const { patents, pagination, loading, error, filters, fetchPatents, updateFilters, goToPage } = usePatents()
  const [departments, setDepartments] = useState([])
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Load initial data
  useEffect(() => {
    fetchPatents()
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    const response = await adminService.getDepartments()
    if (response.success) {
      setDepartments(response.data.results || [])
    }
  }

  const handleViewClick = (patentId) => {
    navigate(`/patents/${patentId}`)
  }

  const handleFilterSubmit = (newFilters) => {
    updateFilters(newFilters)
  }

  const showToast = (message, type = 'info') => {
    setToastMessage(message)
    setToastType(type)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Patent Applications</h1>
        <p className="admin-dashboard__subtitle">Manage and review patent applications</p>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setToastMessage(null)} />}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      <div className="admin-dashboard__container">
        <FilterPanel onFilter={handleFilterSubmit} loading={loading} departments={departments} />

        {loading && !patents.length ? (
          <Loader message="Loading patents..." />
        ) : patents.length === 0 ? (
          <div className="admin-dashboard__empty">
            <p>No patents found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="admin-dashboard__table-wrapper">
              <table className="admin-dashboard__table">
                <thead>
                  <tr>
                    <th>Patent Title</th>
                    <th>Applicant Name</th>
                    <th>Department</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patents.map((patent) => (
                    <tr key={patent.id} className="admin-dashboard__row">
                      <td className="admin-dashboard__cell admin-dashboard__cell--title">
                        <span className="admin-dashboard__title-text">{patent.title}</span>
                      </td>
                      <td className="admin-dashboard__cell">
                        {patent.applicant_name || patent.applicant?.name || '-'}
                      </td>
                      <td className="admin-dashboard__cell">
                        {patent.department_name || patent.department?.name || '-'}
                      </td>
                      <td className="admin-dashboard__cell">
                        {formatDate(patent.submitted_date || patent.created_at)}
                      </td>
                      <td className="admin-dashboard__cell">
                        <span
                          className="admin-dashboard__status"
                          style={{ backgroundColor: STATUS_COLORS[patent.status] }}
                        >
                          {STATUS_LABELS[patent.status] || patent.status}
                        </span>
                      </td>
                      <td className="admin-dashboard__cell admin-dashboard__cell--action">
                        <button
                          className="admin-dashboard__view-btn"
                          onClick={() => handleViewClick(patent.id)}
                          disabled={loading}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination pagination={pagination} onPageChange={goToPage} loading={loading} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
