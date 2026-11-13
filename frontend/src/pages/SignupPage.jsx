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
              Open registration for students and faculty. External consultants and review committee members are provisioned by the IP Cell.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default SignupPage
