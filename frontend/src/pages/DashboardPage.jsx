/**
 * DashboardPage
 * Main dashboard for applicants to view and manage their patent applications
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Container, Button, Card } from '../components/common'
import { PatentList } from '../components/dashboard'
import { getMyPatents } from '../services/patentService'
import './DashboardPage.css'

function DashboardPage() {
  const { user } = useAuth()
  
  // Patent data state
  const [patents, setPatents] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    under_review: 0,
    approved: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch patents on mount
  useEffect(() => {
    fetchPatents()
  }, [])

  const fetchPatents = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getMyPatents()
    
    if (result.success) {
      const responseData = result.data
      const patentList = responseData.results || responseData.patents || (Array.isArray(responseData) ? responseData : [])
      const responseStats = responseData.stats || null

      setPatents(patentList)

      if (responseStats) {
        setStats(responseStats)
      } else if (Array.isArray(patentList)) {
        const calculatedStats = {
          total: responseData.count ?? patentList.length,
          drafts: patentList.filter(p => p.status === 'draft').length,
          under_review: patentList.filter(p =>
            [
              'submitted',
              'under_consultant_review',
              'under_review_team',
              'pending_final_approval',
              'under_scrutiny',
              'forwarded_to_consultant',
            ].includes(p.status)
          ).length,
          approved: patentList.filter(p => p.status === 'approved').length,
        }
        setStats(calculatedStats)
      }
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="dashboard-page">
      <Container>
        {/* Page Header */}
        <div className="dashboard__header">
          <div className="dashboard__greeting">
            <h1 className="dashboard__title">
              Applicant Portal
            </h1>
            <p className="dashboard__subtitle">
              Welcome back, <strong>{user?.name || 'Applicant'}</strong> • {user?.department_detail?.name || 'Academic Department'}
            </p>
          </div>
          <div className="dashboard__actions">
            <Link to="/patents/new">
              <Button variant="primary" size="large">
                + File New Patent Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="dashboard__stats">
          <Card className="stat-card">
            <div className="stat-card__number">{stats.total}</div>
            <div className="stat-card__label">Total Applications</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-card__number">{stats.drafts}</div>
            <div className="stat-card__label">In Draft</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-card__number">{stats.under_review}</div>
            <div className="stat-card__label">Under Formal Review</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-card__number">{stats.approved}</div>
            <div className="stat-card__label">Approved for Filing</div>
          </Card>
        </div>

        {/* Patents List Section */}
        <section className="dashboard__patents">
          <div className="section-header">
            <h2 className="section-header__title">My Applications</h2>
            {!loading && !error && patents.length > 0 && (
              <span className="section-header__count">
                {patents.length} application{patents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <PatentList 
            patents={patents}
            loading={loading}
            error={error}
            onRetry={fetchPatents}
          />
        </section>

        {/* Workflow Stage Guide */}
        <section className="dashboard__workflow-guide" style={{ marginTop: '36px' }}>
          <Card padding="large">
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-primary-dark)' }}>
              Patent Evaluation Workflow Overview
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#e2e8f0',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Step 1
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Submission & Disclosures</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Applicant provides technical invention details and uploads the mandatory Patent Report (PDF).
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#ede9fe',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#7c3aed',
                  marginBottom: '8px'
                }}>
                  Step 2
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Consultant Review</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  External patent consultant evaluates novelty, attaches an Evaluation Report, and routes to committee.
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#fef3c7',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#d97706',
                  marginBottom: '8px'
                }}>
                  Step 3
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Internal Committee</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Review team meets, reviews technical merit, attaches meeting report, and recommends decision.
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#16a34a',
                  marginBottom: '8px'
                }}>
                  Step 4
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Final Disposition</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Consultant issues final approval or rejection with remarks for legal patent filing.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </Container>
    </div>
  )
}

export default DashboardPage
