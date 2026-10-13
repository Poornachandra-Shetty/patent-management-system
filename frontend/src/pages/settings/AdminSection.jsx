/**
 * AdminSection
 * Rendered only when the logged-in user has role === 'admin'.
 * A non-admin user who somehow navigates here sees an access-denied
 * message — the backend enforces IsAdminRole on every protected endpoint
 * so frontend visibility is a UX convenience, not the security boundary.
 *
 * Props:
 *   activeTab : 'users' | 'departments' | 'audit'
 *     Passed from SettingsPage.renderSection() based on which sidebar
 *     item the user clicked.
 *
 * Three sub-views, each fetching from real APIs:
 *
 * 1. User Management   — GET /auth/users/  (paginated, search, role filter)
 *                      — PATCH /auth/users/{id}/  (toggle is_active)
 *
 * 2. Departments       — GET /departments/  (read-only — no write endpoints)
 *
 * 3. Audit Logs        — GET /audit/  (patent list)
 *                      — GET /audit/patents/{id}/  (timeline per patent)
 *
 * Patent Workflow Configuration is NOT shown — transitions are hardcoded
 * in workflow/state_machine.py; no configurable backend exists.
 *
 * Security & System Settings are NOT shown — would expose secrets; no
 * configurable backend controls exist.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Building2, ClipboardList,
  Search, AlertCircle, Info, ShieldOff,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLES } from '../../utils/constants'
import {
  getUsers, updateUser, getDepartments,
  getAuditPatents, getPatentAuditTrail,
} from '../../services/settingsService'
import './AdminSection.css'

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Skeleton rows ──────────────────────────────────────────────────────────

function SkeletonRows({ cols = 4, rows = 5 }) {
  return (
    <div className="admin-table-wrap">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className="admin-skeleton-cell"
              style={{ flex: j === 0 ? '0 0 28px' : 1, width: j === 0 ? 28 : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── 1. User Management ─────────────────────────────────────────────────────

const PAGE_SIZE = 20

function UsersTab() {
  const [users,     setUsers]     = useState([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [toggling,  setToggling]  = useState(null) // userId being toggled

  const fetchUsers = useCallback(async (pg = 1, q = search, role = roleFilter) => {
    setLoading(true)
    setError(null)
    const params = { page: pg, page_size: PAGE_SIZE }
    if (q.trim())  params.search = q.trim()
    if (role)       params.role   = role
    const result = await getUsers(params)
    if (result.success) {
      const data = result.data
      setUsers(data.results ?? (Array.isArray(data) ? data : []))
      setTotal(data.count ?? (Array.isArray(data) ? data.length : 0))
      setPage(pg)
    } else {
      setError(result.error || 'Failed to load users.')
    }
    setLoading(false)
  }, [search, roleFilter])

  useEffect(() => { fetchUsers(1, '', '') }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers(1, search, roleFilter)
  }

  const handleRoleFilter = (e) => {
    const val = e.target.value
    setRoleFilter(val)
    fetchUsers(1, search, val)
  }

  const handleToggleActive = async (u) => {
    setToggling(u.id)
    const result = await updateUser(u.id, { is_active: !u.is_active })
    if (result.success) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: result.data.is_active } : x))
    } else {
      setError(result.error || 'Failed to update user.')
    }
    setToggling(null)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="admin-section__header">
        <h2>User &amp; Role Management</h2>
        <p>View all registered users. Activate or deactivate accounts. Role changes are reflected immediately.</p>
      </div>

      <div className="admin-info-note">
        <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Role assignments and account status changes are enforced by the backend — only authenticated
        administrators can perform these operations.
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form className="admin-toolbar" onSubmit={handleSearch}>
        <div className="admin-toolbar__search">
          <Search size={14} />
          <input
            type="search"
            placeholder="Search by name, email or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="admin-toolbar__filter" value={roleFilter} onChange={handleRoleFilter}>
          <option value="">All roles</option>
          <option value="applicant">Applicant</option>
          <option value="scrutinizer">Scrutinizer</option>
          <option value="consultant">Consultant</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn btn--secondary btn--small">
          <Search size={13} /> Search
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => fetchUsers(page)}>
          <RefreshCw size={13} />
        </button>
        {total > 0 && <span className="admin-toolbar__count">{total} user{total !== 1 ? 's' : ''}</span>}
      </form>

      {loading ? (
        <SkeletonRows cols={5} rows={6} />
      ) : users.length === 0 ? (
        <div className="admin-empty"><p>No users found matching your criteria.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID / USN</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{u.usn_or_emp_id}</td>
                  <td style={{ fontSize: '0.82rem' }}>{u.email}</td>
                  <td>
                    <span className={`admin-role-badge admin-role-badge--${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {u.department_detail?.name ?? (u.department ? `Dept #${u.department}` : '—')}
                  </td>
                  <td>
                    <span className={`admin-active-badge admin-active-badge--${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-toggle-btn"
                      onClick={() => handleToggleActive(u)}
                      disabled={toggling === u.id}
                      aria-label={u.is_active ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                    >
                      {toggling === u.id ? '…' : (u.is_active ? 'Deactivate' : 'Activate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination__info">
            Page {page} of {totalPages}
          </span>
          <div className="admin-pagination__btns">
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => fetchUsers(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => fetchUsers(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 2. Departments ─────────────────────────────────────────────────────────

function DepartmentsTab() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchDepts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getDepartments()
    if (result.success) {
      const data = result.data
      setDepartments(data.results ?? (Array.isArray(data) ? data : []))
    } else {
      setError(result.error || 'Failed to load departments.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchDepts() }, [fetchDepts])

  return (
    <div>
      <div className="admin-section__header">
        <h2>Department Management</h2>
        <p>View all college departments and their codes. Codes are used in patent ID generation.</p>
      </div>

      <div className="admin-info-note">
        <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Department records are currently read-only. Create or update operations require
        direct database access or a future admin API endpoint.
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <div className="admin-toolbar">
        <span className="admin-toolbar__count">
          {!loading && `${departments.length} department${departments.length !== 1 ? 's' : ''}`}
        </span>
        <button type="button" className="btn btn--ghost btn--small" onClick={fetchDepts}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <SkeletonRows cols={3} rows={5} />
      ) : departments.length === 0 ? (
        <div className="admin-empty"><p>No departments found.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Department Name</th>
                <th>Code</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td><span className="admin-dept-code">{d.code}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── 3. Audit Logs ──────────────────────────────────────────────────────────

const AUDIT_PAGE_SIZE = 20

function AuditTab() {
  const [patents,    setPatents]    = useState([])
  const [selected,   setSelected]   = useState('')
  const [trail,      setTrail]      = useState([])
  const [trailTotal, setTrailTotal] = useState(0)
  const [trailOffset, setTrailOffset] = useState(0)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingTrail, setLoadingTrail] = useState(false)
  const [listError,  setListError]  = useState(null)
  const [trailError, setTrailError] = useState(null)

  // Fetch patent list on mount
  useEffect(() => {
    const fetch = async () => {
      setLoadingList(true)
      setListError(null)
      const result = await getAuditPatents({ limit: 100 })
      if (result.success) {
        setPatents(result.data?.auditable_patents ?? [])
      } else {
        setListError(result.error || 'Failed to load audit patents.')
      }
      setLoadingList(false)
    }
    fetch()
  }, [])

  // Fetch trail when selected patent changes
  const fetchTrail = useCallback(async (patentId, offset = 0) => {
    if (!patentId) return
    setLoadingTrail(true)
    setTrailError(null)
    const result = await getPatentAuditTrail(patentId, { limit: AUDIT_PAGE_SIZE, offset })
    if (result.success) {
      setTrail(result.data?.audit_trail ?? [])
      setTrailTotal(result.data?.total_entries ?? 0)
      setTrailOffset(offset)
    } else {
      setTrailError(result.error || 'Failed to load audit trail.')
    }
    setLoadingTrail(false)
  }, [])

  const handleSelectPatent = (patentId) => {
    setSelected(patentId)
    setTrail([])
    setTrailOffset(0)
    if (patentId) fetchTrail(patentId, 0)
  }

  const totalPages = Math.ceil(trailTotal / AUDIT_PAGE_SIZE)
  const currentPage = Math.floor(trailOffset / AUDIT_PAGE_SIZE) + 1

  return (
    <div>
      <div className="admin-section__header">
        <h2>Audit Logs</h2>
        <p>View the full audit trail of status changes and remarks for each patent application.</p>
      </div>

      {listError && (
        <div className="admin-error" role="alert">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {listError}
        </div>
      )}

      {/* Patent selector */}
      <div className="admin-audit-selector">
        <label htmlFor="audit-patent-select">Select Patent</label>
        <select
          id="audit-patent-select"
          value={selected}
          onChange={(e) => handleSelectPatent(e.target.value)}
          disabled={loadingList}
        >
          <option value="">— {loadingList ? 'Loading…' : `Choose from ${patents.length} patent${patents.length !== 1 ? 's' : ''}`} —</option>
          {patents.map((p) => (
            <option key={p.patent_id} value={p.patent_id}>
              {p.patent_id} — {p.title} ({p.status})
            </option>
          ))}
        </select>
        {selected && (
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => fetchTrail(selected, trailOffset)}
            aria-label="Refresh audit trail"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* Trail */}
      {!selected ? (
        <div className="admin-empty">
          <p>Select a patent above to view its audit trail.</p>
        </div>
      ) : trailError ? (
        <div className="admin-error" role="alert">
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {trailError}
        </div>
      ) : loadingTrail ? (
        <SkeletonRows cols={4} rows={5} />
      ) : trail.length === 0 ? (
        <div className="admin-empty"><p>No audit entries found for this patent.</p></div>
      ) : (
        <>
          {trailTotal > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
              {trailTotal} total entr{trailTotal !== 1 ? 'ies' : 'y'} — showing {trailOffset + 1}–{Math.min(trailOffset + AUDIT_PAGE_SIZE, trailTotal)}
            </p>
          )}

          <div className="admin-audit-timeline">
            {trail.map((entry) => (
              <div key={`${entry.entry_type}-${entry.entry_id}`} className="admin-audit-entry">
                <div className={`admin-audit-entry__dot admin-audit-entry__dot--${entry.entry_type}`} aria-hidden="true" />
                <div className="admin-audit-entry__main">
                  <div className="admin-audit-entry__top">
                    <span className="admin-audit-entry__actor">
                      {entry.actor?.name ?? '—'}
                    </span>
                    <span
                      className={`admin-entry-badge admin-entry-badge--${entry.entry_type === 'status_change' ? 'status_change' : 'remark'}`}
                    >
                      {entry.entry_type === 'status_change' ? 'Status Change' : 'Remark'}
                    </span>
                    {entry.actor_role && (
                      <span className={`admin-role-badge admin-role-badge--${entry.actor_role}`}>
                        {entry.actor_role}
                      </span>
                    )}
                  </div>

                  {entry.entry_type === 'status_change' ? (
                    <p className="admin-audit-entry__detail">
                      {entry.from_status} → <strong>{entry.to_status}</strong>
                      {entry.transition_note ? ` — ${entry.transition_note}` : ''}
                    </p>
                  ) : (
                    <p className="admin-audit-entry__detail">
                      {entry.remark_action ? `[${entry.remark_action}] ` : ''}
                      {entry.remark_text ?? ''}
                    </p>
                  )}

                  <p className="admin-audit-entry__meta">{timeAgo(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination__info">Page {currentPage} of {totalPages}</span>
              <div className="admin-pagination__btns">
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => fetchTrail(selected, trailOffset - AUDIT_PAGE_SIZE)}
                  disabled={trailOffset === 0}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => fetchTrail(selected, trailOffset + AUDIT_PAGE_SIZE)}
                  disabled={trailOffset + AUDIT_PAGE_SIZE >= trailTotal}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Tab icon map ───────────────────────────────────────────────────────────

const TAB_TITLES = {
  users:       { label: 'User Management',   icon: Users },
  departments: { label: 'Departments',        icon: Building2 },
  audit:       { label: 'Audit Logs',         icon: ClipboardList },
}

// ── Main component ─────────────────────────────────────────────────────────

function AdminSection({ activeTab = 'users' }) {
  const { user } = useAuth()
  const isAdmin = user?.role === USER_ROLES.ADMIN

  // Hard gate — non-admins see access denied regardless of frontend routing
  if (!isAdmin) {
    return (
      <div className="admin-section__denied" role="alert">
        <div className="admin-section__denied-icon">
          <ShieldOff size={24} />
        </div>
        <h3>Access Denied</h3>
        <p>
          This section is restricted to administrators. All operations on this
          page are also enforced server-side.
        </p>
      </div>
    )
  }

  const tab = TAB_TITLES[activeTab]

  return (
    <div>
      {/* Breadcrumb-style heading */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        fontSize: '0.78rem',
        color: 'var(--color-text-muted)',
      }}>
        {tab && <tab.icon size={13} />}
        <span>Administration › {tab?.label ?? activeTab}</span>
      </div>

      {activeTab === 'users'       && <UsersTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
      {activeTab === 'audit'       && <AuditTab />}
    </div>
  )
}

export default AdminSection
