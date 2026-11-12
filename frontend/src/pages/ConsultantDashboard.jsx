/**
 * ConsultantDashboard Page
 * Clean, direct portal for Patent Consultants:
 * 1. View applicant patent disclosures & documents
 * 2. Forward to Review Team committee
 * 3. Give final Approval / Rejection after committee evaluation
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

  // Active Queue: 'evaluation' | 'final' | 'committee' | 'all'
  const [activeQueue, setActiveQueue] = useState('evaluation')

  // Forward to Review Team Modal State
  const [forwardModalOpen, setForwardModalOpen] = useState(false)
  const [selectedPatent, setSelectedPatent] = useState(null)
  const [evalFile, setEvalFile] = useState(null)
  const [forwardNote, setForwardNote] = useState('')
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

  // Filter queues
  const pendingEvaluationQueue = patents.filter(p =>
    [
      PATENT_STATUS.SUBMITTED,
      PATENT_STATUS.UNDER_CONSULTANT_REVIEW,
      PATENT_STATUS.FORWARDED_TO_CONSULTANT,
    ].includes(p.status)
  )
  const readyForFinalQueue = patents.filter(p => p.status === PATENT_STATUS.PENDING_FINAL_APPROVAL)
  const inCommitteeQueue = patents.filter(p => p.status === PATENT_STATUS.UNDER_REVIEW_TEAM)
  const completedList = patents.filter(p => [PATENT_STATUS.APPROVED, PATENT_STATUS.REJECTED].includes(p.status))

  // Open Forward to Review Team modal
  const handleOpenForward = (patent) => {
    setSelectedPatent(patent)
    setEvalFile(null)
    setForwardNote('')
    setForwardModalOpen(true)
  }

  // Submit Forward to Review Team
  const handleConfirmForward = async (e) => {
    e.preventDefault()
    setProcessingAction(true)

    try {
      // 1. If consultant attached an evaluation report PDF, upload it
      if (evalFile) {
        const uploadRes = await documentService.uploadDocument(
          selectedPatent.id,
          DOCUMENT_TYPES.CONSULTANT_EVALUATION_REPORT,
          evalFile
        )
        if (!uploadRes.success) {
          showToast(`Report upload failed: ${uploadRes.error}`, 'warning')
        }
      }

      // 2. Transition patent status to UNDER_REVIEW_TEAM
      const patentIdentifier = selectedPatent.patent_id || selectedPatent.id
      const transitionRes = await adminService.transitionPatent(patentIdentifier, {
        to_status: PATENT_STATUS.UNDER_REVIEW_TEAM,
        note: forwardNote || 'Consultant reviewed submission and forwarded to Review Team committee.',
      })

      if (transitionRes.success) {
        showToast('Application forwarded to Review Team committee successfully.', 'success')
        setForwardModalOpen(false)
        setSelectedPatent(null)
        setEvalFile(null)
        setForwardNote('')
        fetchConsultantPatents()
      } else {
        showToast(transitionRes.error || 'Failed to forward to review team.', 'error')
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error')
      console.error(err)
    } finally {
      setProcessingAction(false)
    }
  }

  // Open Final Decision modal
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

      const patentIdentifier = selectedPatent.patent_id || selectedPatent.id
      const transitionRes = await adminService.transitionPatent(patentIdentifier, {
        to_status: targetStatus,
        note: decisionNote || defaultNote,
      })

      if (transitionRes.success) {
        showToast(`Patent marked as ${decisionType === 'approved' ? 'Approved' : 'Rejected'}!`, 'success')
        setDecisionModalOpen(false)
        setSelectedPatent(null)
        setDecisionNote('')
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

  // Selected queue list
  let displayedPatents = patents
  if (activeQueue === 'evaluation') displayedPatents = pendingEvaluationQueue
  else if (activeQueue === 'final') displayedPatents = readyForFinalQueue
  else if (activeQueue === 'committee') displayedPatents = inCommitteeQueue
  else if (activeQueue === 'all') displayedPatents = completedList

  return (
    <div className="consultant-dashboard">
      {/* Header */}
      <div className="consultant-dashboard__header">
        <div className="consultant-dashboard__welcome">
          <span className="consultant-dashboard__tag">Patent Consultant Console</span>
          <h1 className="consultant-dashboard__title">Welcome, {user?.name || 'Consultant'}</h1>
          <p className="consultant-dashboard__subtitle">
            Review applicant disclosures, submit applications to the Review Team, and issue final patent decisions.
          </p>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* Queue Metric Cards */}
      <div className="consultant-dashboard__metrics">
        <div
          className={`consultant-stat-card ${activeQueue === 'evaluation' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('evaluation')}
        >
          <div className="consultant-stat-card__num">{pendingEvaluationQueue.length}</div>
          <div className="consultant-stat-card__label">Needs Review & Forward</div>
          <div className="consultant-stat-card__hint">Forward to Review Team</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'final' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('final')}
        >
          <div className="consultant-stat-card__num">{readyForFinalQueue.length}</div>
          <div className="consultant-stat-card__label">Ready for Final Decision</div>
          <div className="consultant-stat-card__hint">Review Team report received</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'committee' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('committee')}
        >
          <div className="consultant-stat-card__num">{inCommitteeQueue.length}</div>
          <div className="consultant-stat-card__label">With Review Committee</div>
          <div className="consultant-stat-card__hint">Awaiting committee review</div>
        </div>

        <div
          className={`consultant-stat-card ${activeQueue === 'all' ? 'consultant-stat-card--active' : ''}`}
          onClick={() => setActiveQueue('all')}
        >
          <div className="consultant-stat-card__num">{completedList.length}</div>
          <div className="consultant-stat-card__label">Decided Applications</div>
          <div className="consultant-stat-card__hint">Approved / Rejected</div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="consultant-dashboard__card">
        <div className="consultant-dashboard__toolbar">
          <div className="consultant-dashboard__queue-tabs">
            <button
              className={`consultant-tab-btn ${activeQueue === 'evaluation' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('evaluation')}
            >
              Needs Review ({pendingEvaluationQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'final' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('final')}
            >
              Ready for Final Decision ({readyForFinalQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'committee' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('committee')}
            >
              With Review Committee ({inCommitteeQueue.length})
            </button>
            <button
              className={`consultant-tab-btn ${activeQueue === 'all' ? 'consultant-tab-btn--active' : ''}`}
              onClick={() => setActiveQueue('all')}
            >
              Decided ({completedList.length})
            </button>
          </div>
        </div>

        {loading ? (
          <Loader message="Loading applications..." />
        ) : displayedPatents.length === 0 ? (
          <div className="consultant-dashboard__empty">
            <p>No applications currently in this queue.</p>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedPatents.map((p) => {
                  const isPendingReview = [
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
                        {/* Stage 1: Forward to Review Team */}
                        {isPendingReview && (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleOpenForward(p)}
                          >
                            Forward to Review Team →
                          </Button>
                        )}

                        {/* Stage 2: Final Decision */}
                        {isReadyForFinal && (
                          <div className="consultant-actions-group">
                            <button
                              className="consultant-btn consultant-btn--approve"
                              onClick={() => handleOpenDecision(p, 'approved')}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="consultant-btn consultant-btn--reject"
                              onClick={() => handleOpenDecision(p, 'rejected')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}

                        {/* View Details */}
                        <button
                          className="consultant-btn consultant-btn--view"
                          onClick={() => navigate(`/patents/${p.id}`)}
                        >
                          View Details
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

      {/* FORWARD TO REVIEW TEAM MODAL */}
      {forwardModalOpen && selectedPatent && (
        <Modal
          isOpen={forwardModalOpen}
          title={`Forward to Review Team: ${selectedPatent.patent_id || selectedPatent.title}`}
          onClose={() => !processingAction && setForwardModalOpen(false)}
        >
          <form onSubmit={handleConfirmForward} className="consultant-modal-form">
            <div className="consultant-modal-summary">
              <strong>Application:</strong> {selectedPatent.title}
              <br />
              <strong>Department:</strong> {selectedPatent.department_detail?.name || '-'}
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">
                Consultant Evaluation Report (PDF)
                <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                  (Optional)
                </span>
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="consultant-file-input"
                onChange={(e) => setEvalFile(e.target.files[0])}
              />
              <span className="consultant-modal-help">
                Optionally attach your technical evaluation notes or findings for the committee.
              </span>
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">Review Notes / Remarks</label>
              <textarea
                className="consultant-textarea"
                rows="3"
                placeholder="Initial remarks or guidelines for the review committee..."
                value={forwardNote}
                onChange={(e) => setForwardNote(e.target.value)}
              />
            </div>

            <div className="consultant-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setForwardModalOpen(false)}
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
                Confirm & Forward to Review Team →
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* FINAL DECISION MODAL */}
      {decisionModalOpen && selectedPatent && (
        <Modal
          isOpen={decisionModalOpen}
          title={`Final Decision: ${decisionType === 'approved' ? 'Approve' : 'Reject'} Patent`}
          onClose={() => !processingAction && setDecisionModalOpen(false)}
        >
          <form onSubmit={handleExecuteDecision} className="consultant-modal-form">
            <div className="consultant-modal-summary">
              <strong>Application:</strong> {selectedPatent.patent_id} - {selectedPatent.title}
              <p style={{ marginTop: '8px', color: decisionType === 'approved' ? '#059669' : '#dc2626', fontWeight: '600' }}>
                {decisionType === 'approved'
                  ? 'Application will be marked as APPROVED and cleared for formal patent filing.'
                  : 'Application will be marked as REJECTED.'}
              </p>
            </div>

            <div className="consultant-modal-field">
              <label className="consultant-modal-label">Final Remarks</label>
              <textarea
                className="consultant-textarea"
                rows="3"
                placeholder="Concurrence with Review Committee, legal filing notes..."
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
