/**
 * Navbar Component
 * Horizontal navigation bar with logo and menu items
 * Based on UI reference: logo left, menu items right
 */

import { ChevronDown, Search, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ isLoggedIn = false, userName = '', onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__brand" aria-label="Go to home page">
          <img
            src="/photos/SJEC logo.png"
            alt="SJEC logo"
            className="navbar__brand-logo"
          />
          <div className="navbar__brand-copy">
            <span className="navbar__brand-primary">SJEC</span>
            <span className="navbar__brand-secondary">Patent Management System</span>
          </div>
        </Link>

        <div className="navbar__actions">
          <label className="navbar__search" aria-label="Search patents">
            <Search size={16} />
            <input type="search" placeholder="Search patents" />
          </label>

          {isLoggedIn ? (
            <>
              <div className="navbar__user-menu" aria-label="User menu">
                <div className="navbar__avatar">
                  <UserCircle2 size={22} />
                </div>
                <div className="navbar__user-copy">
                  <span className="navbar__user-name">{userName || 'User'}</span>
                  <span className="navbar__user-role">Faculty</span>
                </div>
                <ChevronDown size={16} />
              </div>

              <button className="navbar__logout-btn" type="button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar__login-link">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
