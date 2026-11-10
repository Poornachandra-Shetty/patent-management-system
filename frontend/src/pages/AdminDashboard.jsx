import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatents } from '../hooks/usePatents'
import * as adminService from '../services/adminService'
import { Loader, Toast, FilterPanel, Pagination, Button, Modal, Input } from '../components/common'
import './AdminDashboard.css'
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants'

function AdminDashboard() {
  const navigate = useNavigate()
  const { patents, pagination, loading, error, filters, fetchPatents, updateFilters, goToPage } = usePatents()
  const [departments, setDepartments] = useState([])
  const [toastMessage, setToastMessage] = useState(null)
  const [toastType, setToastType] = useState('info')

  // Tab State: 'patents' | 'committee'
  const [activeTab, setActiveTab] = useState('patents')

  // Committee State
  const [committeeMembers, setCommitteeMembers] = useState([])
  const [loadingCommittee, setLoadingCommittee] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [submittingMember, setSubmittingMember] = useState(false)
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    email: '',
    usn_or_emp_id: '',
    mobile: '',
    department: '',
    password: 'password123',
  })

  // Load initial data
  useEffect(() => {
    fetchPatents()
    loadDepartments()
    loadCommitteeMembers()
  }, [])

  const loadDepartments = async () => {
    const response = await adminService.getDepartments()
    if (response.success) {
      const list = response.data.results || response.data || []
      setDepartments(list)
      if (list.length > 0 && !newMemberForm.department) {
        setNewMemberForm(prev => ({ ...prev, department: list[0].id }))
      }
    }
  }

  const loadCommitteeMembers = async () => {
    setLoadingCommittee(true)
    const response = await adminService.getUsersByRole('review_team')
    if (response.success) {
      setCommitteeMembers(response.data.results || [])
    }
    setLoadingCommittee(false)
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberForm.name || !newMemberForm.email || !newMemberForm.usn_or_emp_id) {
      showToast('Please fill in all required fields.', 'warning')
      return
    }

    setSubmittingMember(true)
    const res = await adminService.createCommitteeMember({
      ...newMemberForm,
      department: Number(newMemberForm.department) || (departments[0]?.id || 1),
    })

    setSubmittingMember(false)
    if (res.success) {
      showToast('Review team member added successfully!', 'success')
      setShowAddMemberModal(false)
      setNewMemberForm({
        name: '',
        email: '',
        usn_or_emp_id: '',
        mobile: '',
        department: departments[0]?.id || '',
        password: 'password123',
      })
      loadCommitteeMembers()
    } else {
      showToast(res.error || 'Failed to add committee member', 'error')
    }
  }

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the Review Team?`)) {
      return
    }

    const res = await adminService.deleteUser(memberId)
    if (res.success) {
      showToast('Committee member removed successfully.', 'success')
      loadCommitteeMembers()
    } else {
      showToast(res.error || 'Failed to remove member.', 'error')
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
        <div>
          <h1 className="admin-dashboard__title">Admin Control Console</h1>
          <p className="admin-dashboard__subtitle">
            Manage patent applications lifecycle and Review Committee roster
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="admin-dashboard__tabs">
          <button
            className={`admin-dashboard__tab-btn ${activeTab === 'patents' ? 'admin-dashboard__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('patents')}
          >
            📁 Patent Applications
          </button>
          <button
            className={`admin-dashboard__tab-btn ${activeTab === 'committee' ? 'admin-dashboard__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('committee')}
          >
            👥 Review Committee ({committeeMembers.length})
          </button>
        </div>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setToastMessage(null)} />}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      {/* PATENTS TAB */}
      {activeTab === 'patents' && (
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
                          {patent.applicant_detail?.name || patent.applicant_name || patent.applicant?.name || '-'}
                        </td>
                        <td className="admin-dashboard__cell">
                          {patent.department_detail?.name || patent.department_name || patent.department?.name || '-'}
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
      )}

      {/* COMMITTEE MANAGEMENT TAB */}
      {activeTab === 'committee' && (
        <div className="admin-dashboard__container">
          <div className="admin-committee__toolbar">
            <div>
              <h2 className="admin-committee__heading">Review Committee Roster</h2>
              <p className="admin-committee__subheading">
                Maintain the professors and faculty reviewers authorized to evaluate inventions at the committee review stage.
              </p>
            </div>
            <Button
              variant="primary"
              size="medium"
              onClick={() => setShowAddMemberModal(true)}
            >
              + Add Review Team Member
            </Button>
          </div>

          {loadingCommittee ? (
            <Loader message="Loading committee members..." />
          ) : committeeMembers.length === 0 ? (
            <div className="admin-dashboard__empty">
              <p>No Review Team members added yet. Click "+ Add Review Team Member" to get started.</p>
            </div>
          ) : (
            <div className="admin-dashboard__table-wrapper">
              <table className="admin-dashboard__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {committeeMembers.map((member) => (
                    <tr key={member.id} className="admin-dashboard__row">
                      <td className="admin-dashboard__cell"><strong>{member.name}</strong></td>
                      <td className="admin-dashboard__cell">{member.email}</td>
                      <td className="admin-dashboard__cell">{member.usn_or_emp_id || '-'}</td>
                      <td className="admin-dashboard__cell">{member.department_detail?.name || '-'}</td>
                      <td className="admin-dashboard__cell">{member.mobile || '-'}</td>
                      <td className="admin-dashboard__cell">
                        <span className="admin-committee__role-tag">Review Team</span>
                      </td>
                      <td className="admin-dashboard__cell">
                        <button
                          className="admin-committee__delete-btn"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          title="Remove from Committee"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <Modal
          title="Add Review Committee Member"
          onClose={() => setShowAddMemberModal(false)}
        >
          <form onSubmit={handleAddMember} className="admin-committee__modal-form">
            <Input
              label="Full Name"
              type="text"
              placeholder="Dr. / Prof. Full Name"
              value={newMemberForm.name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="professor@college.edu or gmail"
              value={newMemberForm.email}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
              required
            />
            <Input
              label="Employee ID"
              type="text"
              placeholder="EMP2026"
              value={newMemberForm.usn_or_emp_id}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, usn_or_emp_id: e.target.value })}
              required
            />
            <Input
              label="Mobile Number"
              type="text"
              placeholder="9876543210"
              value={newMemberForm.mobile}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, mobile: e.target.value })}
            />
            <div className="admin-committee__field">
              <label className="input__label">Department</label>
              <select
                className="input__field"
                value={newMemberForm.department}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Temporary Password"
              type="text"
              value={newMemberForm.password}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
              required
            />
            <div className="admin-committee__modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                disabled={submittingMember}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={submittingMember}
                disabled={submittingMember}
              >
                Save Member
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminDashboard
