/**
 * DashboardPage
 * Main dashboard for applicants to view and manage their patents
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
      // Handle API response structure
      const responseData = result.data
      
      // Check if response has patents array or is the array itself
      const patentList = responseData.patents || responseData || []
      const responseStats = responseData.stats || null
      
      setPatents(patentList)
      
      // Calculate stats from patents if not provided by API
      if (responseStats) {
        setStats(responseStats)
      } else if (Array.isArray(patentList)) {
        const calculatedStats = {
          total: patentList.length,
          drafts: patentList.filter(p => p.status === 'draft').length,
          under_review: patentList.filter(p => 
            ['submitted', 'under_scrutiny', 'forwarded_to_consultant'].includes(p.status)
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
              Welcome, {user?.name || 'Applicant'}
            </h1>
            <p className="dashboard__subtitle">
              Manage your patent applications and track their status
            </p>
          </div>
          <div className="dashboard__actions">
            <Link to="/patents/new">
              <Button variant="primary" size="large">
                + New Patent Application
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
            <div className="stat-card__label">Drafts</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-card__number">{stats.under_review}</div>
            <div className="stat-card__label">Under Review</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-card__number">{stats.approved}</div>
            <div className="stat-card__label">Approved</div>
          </Card>
        </div>

        {/* Patents List Section */}
        <section className="dashboard__patents">
          <div className="section-header">
            <h2 className="section-header__title">My Patent Applications</h2>
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

        {/* Quick Links */}
        <section className="dashboard__quick-links">
          <Card title="Quick Links" subtitle="Helpful resources">
            <div className="quick-links">
              <a href="#" className="quick-link">
                <span className="quick-link__icon">📄</span>
                <span className="quick-link__text">SJEC Patent Policy</span>
              </a>
              <a href="#" className="quick-link">
                <span className="quick-link__icon">📋</span>
                <span className="quick-link__text">Patent Application Form</span>
              </a>
              <a href="#" className="quick-link">
                <span className="quick-link__icon">🔒</span>
                <span className="quick-link__text">NDA Template</span>
              </a>
              <a href="#" className="quick-link">
                <span className="quick-link__icon">❓</span>
                <span className="quick-link__text">FAQ</span>
              </a>
            </div>
          </Card>
        </section>
      </Container>
    </div>
  )
}

export default DashboardPage
