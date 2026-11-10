/**
 * ReviewTeamDashboard Page
 * Dedicated dashboard for College IP Cell Review Team / Committee
 * Handles Stage: UNDER_REVIEW_TEAM
 * Inspects Consultant Evaluation Report, conducts internal review, and uploads Review Report PDF
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as adminService from '../services/adminService'
import * as documentService from '../services/documentService'
import { Loader, Toast, Modal, Button } from '../components/common'
import { PATENT_STATUS, STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPES } from '../utils/constants'
import './ReviewTeamDashboard.css'

function ReviewTeamDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // State
  const [patents, setPatents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Active filter tab: 'pending' (UNDER_REVIEW_TEAM) | 'completed' | 'all'
  const [activeTab, setActiveTab] = useState('pending')

  // Review Meeting Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedPatent, setSelectedPatent] = useState(null)
  const [reportFile, setReportFile] = useState(null)
  const [meetingNotes, setMeetingNotes] = useState('')
  const [reviewDecision, setReviewDecision] = useState('proceed') // 'proceed' | 'reject'
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchReviewTeamPatents()
  }, [])

  const fetchReviewTeamPatents = async () => {
    setLoading(true)
    setError(null)

    const res = await adminService.getPatents({ page_size: 100 })
    if (res.success) {
      const list = res.data.results || res.data || []
      setPatents(list)
    } else {
      setError(res.error || 'Failed to load committee applications')
    }
    setLoading(false)
  }

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg)
    setToastType(type)
  }

  // Calculate metrics
  const pendingQueue = patents.filter(p => p.status === PATENT_STATUS.UNDER_REVIEW_TEAM)
  const forwardedForApproval = patents.filter(p => p.status === PATENT_STATUS.PENDING_FINAL_APPROVAL)
  const completedList = patents.filter(p => [PATENT_STATUS.APPROVED, PATENT_STATUS.REJECTED].includes(p.status))

  const handleOpenReview = (patent) => {
    setSelectedPatent(patent)
    setReportFile(null)
    setMeetingNotes('')
    setReviewDecision('proceed')
    setReviewModalOpen(true)
  }

  const handleSubmitCommitteeReview = async (e) => {
    e.preventDefault()

    if (reviewDecision === 'proceed' && !reportFile) {
      showToast('Please attach the Review Team Meeting Report PDF.', 'warning')
      return
    }

    setSubmittingReview(true)
    try {
      // 1. If proceeding, upload mandatory Internal Review Report PDF
      if (reviewDecision === 'proceed') {
        const uploadRes = await documentService.uploadDocument(
          selectedPatent.id,
          DOCUMENT_TYPES.INTERNAL_REVIEW_REPORT,
          reportFile
        )

        if (!uploadRes.success) {
          showToast(uploadRes.error || 'Failed to upload review report.', 'error')
          setSubmittingReview(false)
          return
        }
      }

      // 2. Transition patent status
      const targetStatus = reviewDecision === 'proceed'
        ? PATENT_STATUS.PENDING_FINAL_APPROVAL
        : PATENT_STATUS.REJECTED

      const defaultNote = reviewDecision === 'proceed'
        ? 'Internal review meeting completed. Forwarded to Consultant for final approval.'
        : 'Application rejected by Review Committee.'

      const transitionRes = await adminService.transitionPatent(selectedPatent.patent_id, {
        to_status: targetStatus,
        note: meetingNotes || defaultNote,
      })

      if (transitionRes.success) {
        showToast(
          reviewDecision === 'proceed'
            ? 'Review report uploaded! Forwarded for final consultant approval.'
            : 'Application marked as rejected.',
          'success'
        )
        setReviewModalOpen(false)
        fetchReviewTeamPatents()
      } else {
        showToast(transitionRes.error || 'Failed to update patent workflow status.', 'error')
      }
    } catch (err) {
      showToast('An unexpected error occurred during submission.', 'error')
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Display filter
  let displayedPatents = patents
  if (activeTab === 'pending') displayedPatents = pendingQueue
  else if (activeTab === 'forwarded') displayedPatents = forwardedForApproval
  else if (activeTab === 'completed') displayedPatents = completedList

  return (
    <div className="reviewteam-dashboard">
      {/* Header */}
      <div className="reviewteam-dashboard__header">
        <span className="reviewteam-dashboard__tag">Review Committee Portal</span>
        <h1 className="reviewteam-dashboard__title">Welcome, {user?.name || 'Committee Member'}</h1>
        <p className="reviewteam-dashboard__subtitle">
          Conduct internal IP cell committee evaluations, upload meeting reports, and submit recommendations.
        </p>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* Metrics Row */}
      <div className="reviewteam-dashboard__metrics">
        <div
          className={`reviewteam-stat-card ${activeTab === 'pending' ? 'reviewteam-stat-card--active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="reviewteam-stat-card__num">{pendingQueue.length}</div>
          <div className="reviewteam-stat-card__label">Awaiting Committee Review</div>
          <div className="reviewteam-stat-card__hint">Requires internal meeting report</div>
        </div>

        <div
          className={`reviewteam-stat-card ${activeTab === 'forwarded' ? 'reviewteam-stat-card--active' : ''}`}
          onClick={() => setActiveTab('forwarded')}
        >
          <div className="reviewteam-stat-card__num">{forwardedForApproval.length}</div>
          <div className="reviewteam-stat-card__label">Forwarded for Final Approval</div>
          <div className="reviewteam-stat-card__hint">Pending Consultant sign-off</div>
        </div>

        <div
          className={`reviewteam-stat-card ${activeTab === 'completed' ? 'reviewteam-stat-card--active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <div className="reviewteam-stat-card__num">{completedList.length}</div>
          <div className="reviewteam-stat-card__label">Decided Applications</div>
          <div className="reviewteam-stat-card__hint">Approved / Rejected</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="reviewteam-dashboard__card">
        <div className="reviewteam-dashboard__toolbar">
          <div className="reviewteam-dashboard__tabs">
            <button
              className={`reviewteam-tab-btn ${activeTab === 'pending' ? 'reviewteam-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Committee Review Queue ({pendingQueue.length})
            </button>
            <button
              className={`reviewteam-tab-btn ${activeTab === 'forwarded' ? 'reviewteam-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('forwarded')}
            >
              Forwarded for Approval ({forwardedForApproval.length})
            </button>
            <button
              className={`reviewteam-tab-btn ${activeTab === 'all' ? 'reviewteam-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Applications ({patents.length})
            </button>
          </div>
        </div>

        {loading ? (
          <Loader message="Loading committee queue..." />
        ) : displayedPatents.length === 0 ? (
          <div className="reviewteam-dashboard__empty">
            <p>No applications in this committee queue.</p>
          </div>
        ) : (
          <div className="reviewteam-dashboard__table-wrapper">
            <table className="reviewteam-dashboard__table">
              <thead>
                <tr>
                  <th>Patent ID</th>
                  <th>Title</th>
                  <th>Applicant</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPatents.map((p) => {
                  const isAwaitingCommittee = p.status === PATENT_STATUS.UNDER_REVIEW_TEAM

                  return (
                    <tr key={p.id} className="reviewteam-dashboard__row">
                      <td className="reviewteam-dashboard__cell font-mono">{p.patent_id || p.id}</td>
                      <td className="reviewteam-dashboard__cell font-semibold">
                        <span className="reviewteam-title-link" onClick={() => navigate(`/patents/${p.id}`)}>
                          {p.title}
                        </span>
                      </td>
                      <td className="reviewteam-dashboard__cell">
                        {p.applicant_detail?.name || p.applicant_name || p.applicant?.name || '-'}
                      </td>
                      <td className="reviewteam-dashboard__cell">
                        {p.department_detail?.name || p.department_name || p.department?.name || '-'}
                      </td>
                      <td className="reviewteam-dashboard__cell">
                        <span
                          className="reviewteam-status-badge"
                          style={{ backgroundColor: STATUS_COLORS[p.status] || '#6b7280' }}
                        >
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="reviewteam-dashboard__cell">
                        {isAwaitingCommittee ? (
                          <div className="reviewteam-actions-group">
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleOpenReview(p)}
                            >
                              Conduct Review →
                            </Button>
                            <button
                              className="reviewteam-btn reviewteam-btn--view"
                              onClick={() => navigate(`/patents/${p.id}`)}
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <button
                            className="reviewteam-btn reviewteam-btn--view"
                            onClick={() => navigate(`/patents/${p.id}`)}
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMMITTEE REVIEW MODAL */}
      {reviewModalOpen && selectedPatent && (
        <Modal
          title={`Committee Review: ${selectedPatent.patent_id}`}
          onClose={() => !submittingReview && setReviewModalOpen(false)}
        >
          <form onSubmit={handleSubmitCommitteeReview} className="reviewteam-modal-form">
            <div className="reviewteam-modal-summary">
              <strong>Title:</strong> {selectedPatent.title}
              <br />
              <strong>Department:</strong> {selectedPatent.department_detail?.name || '-'}
              <br />
              <strong>Applicant:</strong> {selectedPatent.applicant_detail?.name || selectedPatent.applicant?.name || '-'}
            </div>

            <div className="reviewteam-modal-field">
              <label className="reviewteam-modal-label">Committee Decision</label>
              <div className="reviewteam-radio-group">
                <label className="reviewteam-radio-label">
                  <input
                    type="radio"
                    name="decision"
                    value="proceed"
                    checked={reviewDecision === 'proceed'}
                    onChange={() => setReviewDecision('proceed')}
                  />
                  <span>Recommend Approval (Upload Meeting Report & Send to Consultant)</span>
                </label>
                <label className="reviewteam-radio-label">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={reviewDecision === 'reject'}
                    onChange={() => setReviewDecision('reject')}
                  />
                  <span>Recommend Rejection</span>
                </label>
              </div>
            </div>

            {reviewDecision === 'proceed' && (
              <div className="reviewteam-modal-field">
                <label className="reviewteam-modal-label">
                  Mandatory Review Team Meeting Report (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="reviewteam-file-input"
                  onChange={(e) => setReportFile(e.target.files[0])}
                  required
                />
                <span className="reviewteam-modal-help">
                  Upload the signed internal IP cell committee minutes or evaluation report.
                </span>
              </div>
            )}

            <div className="reviewteam-modal-field">
              <label className="reviewteam-modal-label">Committee Remarks / Meeting Notes</label>
              <textarea
                className="reviewteam-textarea"
                rows="4"
                placeholder="Summary of committee deliberations, suggestions, and novelty concurrence..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
              />
            </div>

            <div className="reviewteam-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setReviewModalOpen(false)}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <Button
                variant={reviewDecision === 'proceed' ? 'primary' : 'danger'}
                type="submit"
                loading={submittingReview}
                disabled={submittingReview}
              >
                {reviewDecision === 'proceed'
                  ? 'Submit Report & Forward →'
                  : 'Reject Application'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ReviewTeamDashboard
