/**
 * ConsultantDashboard Page
 * Dedicated dashboard for External Patent Consultants / Attorneys
 * Manages Stage 1: Technical evaluation report & routing to Review Team
 * Manages Stage 2: Final approval/rejection after committee meeting report
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as adminService from '../services/adminService'
import * as documentService from '../services/documentService'
import { Loader, Toast, Modal, Button } from '../components/common'
import { PATENT_STATUS, STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPES } from '../utils/constants'
import './ConsultantDashboard.css'

function ConsultantDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // State
  const [patents, setPatents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Filter / Queue tab: 'evaluation' (Stage 1) | 'final' (Stage 2) | 'all'
  const [activeQueue, setActiveQueue] = useState('evaluation')

  // Evaluation Modal State
  const [evalModalOpen, setEvalModalOpen] = useState(false)
  const [selectedPatent, setSelectedPatent] = useState(null)
  const [evalFile, setEvalFile] = useState(null)
  const [evalNote, setEvalNote] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Final Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [decisionType, setDecisionType] = useState('approved') // 'approved' | 'rejected'
  const [decisionNote, setDecisionNote] = useState('')

  useEffect(() => {
    fetchConsultantPatents()
  }, [])

  const fetchConsultantPatents = async () => {
    setLoading(true)
    setError(null)

    const res = await adminService.getPatents({ page_size: 100 })
    if (res.success) {
      const list = res.data.results || res.data || []
      setPatents(list)
    } else {
      setError(res.error || 'Failed to load assigned applications')
    }
    setLoading(false)
  }

  const showToast = (msg, type = 'info') => {
    setToastMessage(msg)
    setToastType(type)
  }

  // Calculate metrics
  const evaluationQueue = patents.filter(p =>
    [PATENT_STATUS.SUBMITTED, PATENT_STATUS.UNDER_CONSULTANT_REVIEW, PATENT_STATUS.FORWARDED_TO_CONSULTANT].includes(p.status)
  )
  const reviewTeamQueue = patents.filter(p => p.status === PATENT_STATUS.UNDER_REVIEW_TEAM)
  const finalDecisionQueue = patents.filter(p => p.status === PATENT_STATUS.PENDING_FINAL_APPROVAL)
  const approvedList = patents.filter(p => p.status === PATENT_STATUS.APPROVED)

  // Open Stage 1 Evaluation modal
  const handleOpenEvaluation = (patent) => {
    setSelectedPatent(patent)
    setEvalFile(null)
    setEvalNote('')
    setEvalModalOpen(true)
  }

  // Submit Stage 1 Evaluation (Upload Report + Forward to Review Team)
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault()
    if (!evalFile) {
      showToast('Please attach the Consultant Evaluation Report PDF.', 'warning')
      return
    }

    setProcessingAction(true)
    try {
      // 1. Upload mandatory consultant evaluation report PDF
      const uploadRes = await documentService.uploadDocument(
        selectedPatent.id,
        DOCUMENT_TYPES.CONSULTANT_EVALUATION_REPORT,
        evalFile
      )

      if (!uploadRes.success) {
        showToast(uploadRes.error || 'Failed to upload evaluation report.', 'error')
        setProcessingAction(false)
        return
      }

      // 2. Transition patent status to UNDER_REVIEW_TEAM
      const transitionRes = await adminService.transitionPatent(selectedPatent.patent_id, {
        to_status: PATENT_STATUS.UNDER_REVIEW_TEAM,
        note: evalNote || 'Consultant evaluation complete. Forwarded to Review Team committee.',
      })

      if (transitionRes.success) {
        showToast('Evaluation submitted! Patent forwarded to Review Team committee.', 'success')
        setEvalModalOpen(false)
        fetchConsultantPatents()
      } else {
        showToast(transitionRes.error || 'Evaluation uploaded but failed to update status.', 'error')
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error')
      console.error(err)
    } finally {
      setProcessingAction(false)
    }
  }

  // Open Stage 2 Final Decision modal
  const handleOpenDecision = (patent, type) => {
    setSelectedPatent(patent)
    setDecisionType(type)
    setDecisionNote('')
    setDecisionModalOpen(true)
  }

  // Execute Final Decision (Approve or Reject)
  const handleExecuteDecision = async (e) => {
    e.preventDefault()
    setProcessingAction(true)

    try {
      const targetStatus = decisionType === 'approved' ? PATENT_STATUS.APPROVED : PATENT_STATUS.REJECTED
      const defaultNote = decisionType === 'approved'
        ? 'Application granted final approval for formal patent filing.'
        : 'Application rejected following final consultant review.'

      const transitionRes = await adminService.transitionPatent(selectedPatent.patent_id, {
        to_status: targetStatus,
        note: decisionNote || defaultNote,
      })

      if (transitionRes.success) {
        showToast(`Patent successfully ${decisionType === 'approved' ? 'Approved' : 'Rejected'}!`, 'success')
        setDecisionModalOpen(false)
        fetchConsultantPatents()
      } else {
        showToast(transitionRes.error || 'Failed to record decision.', 'error')
      }
    } catch (err) {
      showToast('Error recording final decision.', 'error')
      console.error(err)
    } finally {
      setProcessingAction(false)
    }
  }

  // Determine which list to show based on active tab
  let displayedPatents = patents
  if (activeQueue === 'evaluation') displayedPatents = evaluationQueue
  else if (activeQueue === 'final') displayedPatents = finalDecisionQueue
  else if (activeQueue === 'committee') displayedPatents = reviewTeamQueue

  return (
    <div className="consultant-dashboard">
      {/* Header */}
      <div className="consultant-dashboard__header">
        <div className="consultant-dashboard__welcome">
          <span className="consultant-dashboard__tag">Consultant Portal</span>
          <h1 className="consultant-dashboard__title">Welcome, {user?.name || 'Patent Consultant'}</h1>
          <p className="consultant-dashboard__subtitle">
            Evaluate technical disclosures, upload novelty findings, and issue final patent decisions.
          </p>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* Metrics Row */}
      <div className="consultant-dashboard__metrics">
        <div
          className={`consultant-stat-card ${activeQueue === 'evaluation' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('evaluation')}
        >
          <div className="consultant-stat-card__num">{evaluationQueue.length}</div>
          <div className="consultant-stat-card__label">Stage 1: Pending Evaluation</div>
          <div className="consultant-stat-card__hint">Requires Evaluation Report PDF</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'committee' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('committee')}
        >
          <div className="consultant-stat-card__num">{reviewTeamQueue.length}</div>
          <div className="consultant-stat-card__label">With Review Committee</div>
          <div className="consultant-stat-card__hint">Internal review meeting in progress</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'final' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('final')}
        >
          <div className="consultant-stat-card__num">{finalDecisionQueue.length}</div>
          <div className="consultant-stat-card__label">Stage 2: Final Decision Ready</div>
          <div className="consultant-stat-card__hint">Committee report received</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'all' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('all')}
        >
          <div className="consultant-stat-card__num">{approvedList.length}</div>
          <div className="consultant-stat-card__label">Total Approved</div>
          <div className="consultant-stat-card__hint">Completed filings</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="consultant-dashboard__card">
        <div className="consultant-dashboard__toolbar">
          <div className="consultant-dashboard__queue-tabs">
            <button
              className={`consultant-tab-btn ${activeQueue === 'evaluation' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('evaluation')}
            >
              Pending Evaluation ({evaluationQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'final' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('final')}
            >
              Final Decision Queue ({finalDecisionQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'committee' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('committee')}
            >
              In Committee Review ({reviewTeamQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'all' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('all')}
            >
              All Applications ({patents.length})
            </button>
          </div>
        </div>

        {loading ? (
          <Loader message="Loading assigned patents..." />
        ) : displayedPatents.length === 0 ? (
          <div className="consultant-dashboard__empty">
            <p>No applications found in this queue.</p>
          </div>
        ) : (
          <div className="consultant-dashboard__table-wrapper">
            <table className="consultant-dashboard__table">
              <thead>
                <tr>
                  <th>Patent ID</th>
                  <th>Title</th>
                  <th>Applicant</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedPatents.map((p) => {
                  const isReadyForEvaluation = [
                    PATENT_STATUS.SUBMITTED,
                    PATENT_STATUS.UNDER_CONSULTANT_REVIEW,
                    PATENT_STATUS.FORWARDED_TO_CONSULTANT,
                  ].includes(p.status)

                  const isReadyForFinal = p.status === PATENT_STATUS.PENDING_FINAL_APPROVAL

                  return (
                    <tr key={p.id} className="consultant-dashboard__row">
                      <td className="consultant-dashboard__cell font-mono">{p.patent_id || p.id}</td>
                      <td className="consultant-dashboard__cell font-semibold">
                        <span className="consultant-title-link" onClick={() => navigate(`/patents/${p.id}`)}>
                          {p.title}
                        </span>
                      </td>
                      <td className="consultant-dashboard__cell">
                        {p.applicant_detail?.name || p.applicant_name || p.applicant?.name || '-'}
                      </td>
                      <td className="consultant-dashboard__cell">
                        {p.department_detail?.name || p.department_name || p.department?.name || '-'}
                      </td>
                      <td className="consultant-dashboard__cell">
                        <span
                          className="consultant-status-badge"
                          style={{ backgroundColor: STATUS_COLORS[p.status] || '#6b7280' }}
                        >
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="consultant-dashboard__cell consultant-actions-cell">
                        {/* Stage 1 Action */}
                        {isReadyForEvaluation && (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleOpenEvaluation(p)}
                          >
                            Evaluate & Forward →
                          </Button>
                        )}

                        {/* Stage 2 Actions */}
                        {isReadyForFinal && (
                          <div className="consultant-actions-group">
                            <button
                              className="consultant-btn consultant-btn--approve"
                              onClick={() => handleOpenDecision(p, 'approved')}
                            >
                              ✓ Final Approve
                            </button>
                            <button
                              className="consultant-btn consultant-btn--reject"
                              onClick={() => handleOpenDecision(p, 'rejected')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}

                        {/* General View Button */}
                        <button
                          className="consultant-btn consultant-btn--view"
                          onClick={() => navigate(`/patents/${p.id}`)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EVALUATION MODAL (STAGE 1) */}
      {evalModalOpen && selectedPatent && (
        <Modal
          title={`Consultant Evaluation: ${selectedPatent.patent_id}`}
          onClose={() => !processingAction && setEvalModalOpen(false)}
        >
          <form onSubmit={handleSubmitEvaluation} className="consultant-modal-form">
            <div className="consultant-modal-summary">
              <strong>Title:</strong> {selectedPatent.title}
              <br />
              <strong>Department:</strong> {selectedPatent.department_detail?.name || '-'}
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">
                Mandatory Consultant Evaluation Report (PDF) *
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="consultant-file-input"
                onChange={(e) => setEvalFile(e.target.files[0])}
                required
              />
              <span className="consultant-modal-help">
                Upload your technical novelty evaluation findings (PDF required to proceed to Review Team).
              </span>
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">Evaluation Remarks / Feedback</label>
              <textarea
                className="consultant-textarea"
                rows="4"
                placeholder="Key prior art notes, technical feasibility, and novelty assessment..."
                value={evalNote}
                onChange={(e) => setEvalNote(e.target.value)}
              />
            </div>

            <div className="consultant-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEvalModalOpen(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={processingAction}
                disabled={processingAction}
              >
                Upload & Forward to Review Team →
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* FINAL DECISION MODAL (STAGE 2) */}
      {decisionModalOpen && selectedPatent && (
        <Modal
          title={`Final Decision: ${decisionType === 'approved' ? 'Approve' : 'Reject'} Patent Application`}
          onClose={() => !processingAction && setDecisionModalOpen(false)}
        >
          <form onSubmit={handleExecuteDecision} className="consultant-modal-form">
            <div className="consultant-modal-summary">
              <strong>Application:</strong> {selectedPatent.patent_id} - {selectedPatent.title}
              <p style={{ marginTop: '8px', color: decisionType === 'approved' ? '#059669' : '#dc2626' }}>
                {decisionType === 'approved'
                  ? 'This application will be marked as APPROVED and cleared for formal patent filing.'
                  : 'This application will be marked as REJECTED with your concluding remarks.'}
              </p>
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">Final Remarks</label>
              <textarea
                className="consultant-textarea"
                rows="4"
                placeholder="Concurrence with Review Committee, legal filing recommendations..."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
              />
            </div>

            <div className="consultant-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <button
                type="submit"
                className={`consultant-btn ${decisionType === 'approved' ? 'consultant-btn--approve' : 'consultant-btn--reject'}`}
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                disabled={processingAction}
              >
                {processingAction ? 'Saving...' : `Confirm ${decisionType === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ConsultantDashboard
