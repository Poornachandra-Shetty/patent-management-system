/**
 * AdminPatentDetail Page
 * Displays patent details, documents, and review timeline
 * Allows adding remarks and assigning consultants
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useReviews } from '../hooks/useReviews'
import * as adminService from '../services/adminService'
import { Loader, Toast, RemarkCard, Modal } from '../components/common'
import './AdminPatentDetail.css'
import { STATUS_LABELS, STATUS_COLORS, REVIEW_VISIBILITY, REVIEW_VISIBILITY_LABELS, USER_ROLES } from '../utils/constants'

function AdminPatentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Patent data
  const [patent, setPatent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Reviews/Remarks
  const { reviews, loading: reviewsLoading, fetchReviews, addReview } = useReviews(id)

  // Remarks form
  const [remarkText, setRemarkText] = useState('')
  const [remarkVisibility, setRemarkVisibility] = useState(REVIEW_VISIBILITY.APPLICANT)
  const [submittingRemark, setSubmittingRemark] = useState(false)

  // Assign consultant
  const [consultants, setConsultants] = useState([])
  const [selectedConsultant, setSelectedConsultant] = useState('')
  const [assigningConsultant, setAssigningConsultant] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Toasts
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Load patent and reviews
  useEffect(() => {
    loadPatentDetail()
    loadConsultants()
  }, [id])

  useEffect(() => {
    if (id) {
      fetchReviews()
    }
  }, [id])

  const loadPatentDetail = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminService.getPatentDetail(id)

      if (response.success) {
        setPatent(response.data)
      } else {
        setError(response.error || 'Failed to load patent details')
      }
    } catch (err) {
      setError('An error occurred while loading patent')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadConsultants = async () => {
    const response = await adminService.getUsersByRole('consultant')

    if (response.success) {
      setConsultants(response.data.results || [])
    }
  }

  const handleAddRemark = async (e) => {
    e.preventDefault()

    if (!remarkText.trim()) {
      showToast('Please enter a remark', 'warning')
      return
    }

    setSubmittingRemark(true)

    try {
      const result = await addReview({
        remark: remarkText,
        visibility: remarkVisibility,
      })

      if (result.success) {
        setRemarkText('')
        setRemarkVisibility(REVIEW_VISIBILITY.APPLICANT)
        showToast('Remark added successfully', 'success')
      } else {
        showToast(result.error || 'Failed to add remark', 'error')
      }
    } catch (err) {
      showToast('An error occurred while adding remark', 'error')
      console.error('Error:', err)
    } finally {
      setSubmittingRemark(false)
    }
  }

  const handleAssignConsultant = async () => {
    if (!selectedConsultant) {
      showToast('Please select a consultant', 'warning')
      return
    }

    setAssigningConsultant(true)

    try {
      const response = await adminService.updatePatent(id, {
        consultant: selectedConsultant,
      })

      if (response.success) {
        setPatent(response.data)
        setShowAssignModal(false)
        setSelectedConsultant('')
        showToast('Consultant assigned successfully', 'success')
      } else {
        showToast(response.error || 'Failed to assign consultant', 'error')
      }
    } catch (err) {
      showToast('An error occurred while assigning consultant', 'error')
      console.error('Error:', err)
    } finally {
      setAssigningConsultant(false)
    }
  }

  const showToast = (message, type = 'info') => {
    setToastMessage(message)
    setToastType(type)
  }

  const canAssignConsultant = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SCRUTINIZER

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <Loader message="Loading patent details..." fullScreen />
  }

  if (error) {
    return (
      <div className="patent-detail">
        <div className="patent-detail__error">
          <p>{error}</p>
          <button className="patent-detail__back-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!patent) {
    return (
      <div className="patent-detail">
        <div className="patent-detail__error">
          <p>Patent not found</p>
          <button className="patent-detail__back-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="patent-detail">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      <button className="patent-detail__back-btn" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="patent-detail__container">
        {/* Patent Information */}
        <section className="patent-detail__section">
          <h2 className="patent-detail__section-title">Patent Information</h2>

          <div className="patent-detail__info-grid">
            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Patent Title</label>
              <p className="patent-detail__value">{patent.title}</p>
            </div>

            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Patent ID</label>
              <p className="patent-detail__value">{patent.patent_id || patent.id}</p>
            </div>

            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Applicant Name</label>
              <p className="patent-detail__value">
                {patent.applicant_name || patent.applicant?.name || '-'}
              </p>
            </div>

            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Department</label>
              <p className="patent-detail__value">
                {patent.department_name || patent.department?.name || '-'}
              </p>
            </div>

            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Status</label>
              <p className="patent-detail__value">
                <span
                  className="patent-detail__status-badge"
                  style={{ backgroundColor: STATUS_COLORS[patent.status] }}
                >
                  {STATUS_LABELS[patent.status] || patent.status}
                </span>
              </p>
            </div>

            <div className="patent-detail__info-item">
              <label className="patent-detail__label">Submission Date</label>
              <p className="patent-detail__value">{formatDate(patent.submitted_date || patent.created_at)}</p>
            </div>
          </div>

          <div className="patent-detail__description">
            <label className="patent-detail__label">Abstract</label>
            <p className="patent-detail__value">{patent.abstract || '-'}</p>
          </div>

          <div className="patent-detail__description">
            <label className="patent-detail__label">Keywords</label>
            <p className="patent-detail__value">{patent.keywords || '-'}</p>
          </div>
        </section>

        {/* Documents */}
        {patent.documents && patent.documents.length > 0 && (
          <section className="patent-detail__section">
            <h2 className="patent-detail__section-title">Documents</h2>

            <div className="patent-detail__documents">
              {patent.documents.map((doc) => (
                <div key={doc.id} className="patent-detail__document">
                  <div className="patent-detail__document-info">
                    <p className="patent-detail__document-type">{doc.document_type || 'Document'}</p>
                    <p className="patent-detail__document-name">{doc.file_name || 'Untitled'}</p>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="patent-detail__download-btn">
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assign Consultant */}
        {canAssignConsultant && (
          <section className="patent-detail__section">
            <h2 className="patent-detail__section-title">Assign Consultant</h2>
            <button
              className="patent-detail__action-btn"
              onClick={() => setShowAssignModal(true)}
            >
              {patent.consultant ? 'Change Consultant' : 'Assign Consultant'}
            </button>
            {patent.consultant && (
              <p className="patent-detail__consultant-info">
                Current Consultant: {patent.consultant_name || patent.consultant.name || `ID: ${patent.consultant}`}
              </p>
            )}
          </section>
        )}

        {/* Reviews Timeline */}
        <section className="patent-detail__section">
          <h2 className="patent-detail__section-title">Review Timeline</h2>

          {reviewsLoading ? (
            <Loader message="Loading reviews..." />
          ) : reviews.length === 0 ? (
            <p className="patent-detail__no-reviews">No reviews yet</p>
          ) : (
            <div className="patent-detail__remarks-list">
              {reviews.map((review) => (
                <RemarkCard key={review.id} remark={review} />
              ))}
            </div>
          )}
        </section>

        {/* Add Remark */}
        <section className="patent-detail__section">
          <h2 className="patent-detail__section-title">Add Remark</h2>

          <form onSubmit={handleAddRemark} className="patent-detail__remark-form">
            <div className="patent-detail__form-group">
              <label htmlFor="remark" className="patent-detail__label">
                Remark
              </label>
              <textarea
                id="remark"
                className="patent-detail__textarea"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter your remark here..."
                disabled={submittingRemark}
                rows={4}
              />
            </div>

            <div className="patent-detail__form-group">
              <label htmlFor="visibility" className="patent-detail__label">
                Visibility
              </label>
              <select
                id="visibility"
                className="patent-detail__select"
                value={remarkVisibility}
                onChange={(e) => setRemarkVisibility(e.target.value)}
                disabled={submittingRemark}
              >
                <option value={REVIEW_VISIBILITY.APPLICANT}>
                  {REVIEW_VISIBILITY_LABELS[REVIEW_VISIBILITY.APPLICANT]}
                </option>
                <option value={REVIEW_VISIBILITY.INTERNAL}>
                  {REVIEW_VISIBILITY_LABELS[REVIEW_VISIBILITY.INTERNAL]}
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="patent-detail__submit-btn"
              disabled={submittingRemark}
            >
              {submittingRemark ? 'Submitting...' : 'Submit Remark'}
            </button>
          </form>
        </section>
      </div>

      {/* Assign Consultant Modal */}
      <Modal
        isOpen={showAssignModal}
        title="Assign Consultant"
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignConsultant}
        confirmText={assigningConsultant ? 'Assigning...' : 'Assign'}
      >
        <div className="patent-detail__modal-body">
          <label htmlFor="consultant-select" className="patent-detail__label">
            Select Consultant
          </label>
          <select
            id="consultant-select"
            className="patent-detail__select"
            value={selectedConsultant}
            onChange={(e) => setSelectedConsultant(e.target.value)}
            disabled={assigningConsultant}
          >
            <option value="">-- Select a Consultant --</option>
            {consultants.map((consultant) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name} ({consultant.email})
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPatentDetail
