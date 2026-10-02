/**
 * SignupPage
 * Registration page for new SJEC applicants.
 */

import { Container } from '../components/common'
import { RegisterForm } from '../components/auth'
import './LoginPage.css'

function SignupPage() {
  return (
    <div className="login-page">
      <Container size="small">
        <div className="login-page__content">
          <div className="login-page__header">
            <h1 className="login-page__brand">SJEC</h1>
            <p className="login-page__tagline">Patent Management System</p>
          </div>

          <RegisterForm />

          <div className="login-page__info">
            <p>
              Registration is open only for valid SJEC staff and student accounts.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default SignupPage
