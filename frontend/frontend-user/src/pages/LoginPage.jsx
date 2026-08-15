/**
 * LoginPage
 * Login page for applicant authentication
 */

import { Container } from '../components/common'
import { LoginForm } from '../components/auth'
import './LoginPage.css'

function LoginPage() {
  return (
    <div className="login-page">
      <Container size="small">
        <div className="login-page__content">
          {/* Decorative Header */}
          <div className="login-page__header">
            <h1 className="login-page__brand">SJEC</h1>
            <p className="login-page__tagline">Patent Management System</p>
          </div>
          
          {/* Login Form */}
          <LoginForm />
          
          {/* Info Section */}
          <div className="login-page__info">
            <p>
              For faculty and students of St Joseph Engineering College.
              Contact the patent office for account creation.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default LoginPage
