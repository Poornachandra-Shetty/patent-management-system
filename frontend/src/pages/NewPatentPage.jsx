/**
 * NewPatentPage
 * Page for creating a new patent application
 */

import { Link } from 'react-router-dom'
import { Container, Button } from '../components/common'
import { PatentForm } from '../components/patent'
import './NewPatentPage.css'

function NewPatentPage() {
  return (
    <div className="new-patent-page">
      <Container size="default">
        {/* Page Header */}
        <div className="new-patent-page__header">
          <div className="new-patent-page__breadcrumb">
            <Link to="/dashboard" className="new-patent-page__breadcrumb-link">
              Dashboard
            </Link>
            <span className="new-patent-page__breadcrumb-separator">/</span>
            <span className="new-patent-page__breadcrumb-current">New Patent</span>
          </div>
          
          <div className="new-patent-page__title-section">
            <h1 className="new-patent-page__title">New Patent Application</h1>
            <p className="new-patent-page__subtitle">
              Fill in the details below to submit a new patent application
            </p>
          </div>
        </div>
        
        {/* Patent Form */}
        <PatentForm />
        
        {/* Help Section */}
        <div className="new-patent-page__help">
          <h3>Need Help?</h3>
          <ul>
            <li>Review the <a href="#">SJEC Patent Policy</a> before submitting</li>
            <li>Download the <a href="#">Patent Application Form</a> template</li>
            <li>Check the <a href="#">Patent Guidelines</a> for detailed instructions</li>
            <li>Read our <a href="#">FAQ</a> for common questions</li>
          </ul>
        </div>
      </Container>
    </div>
  )
}

export default NewPatentPage
