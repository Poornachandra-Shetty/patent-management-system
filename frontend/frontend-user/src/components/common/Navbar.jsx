/**
 * Navbar Component
 * Horizontal navigation bar with logo and menu items
 * Based on UI reference: logo left, menu items right
 */

import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar({ isLoggedIn = false, userName = '', onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">SJEC</span>
          <span className="navbar__logo-subtitle">Patent Portal</span>
        </Link>

        {/* Navigation */}
        <nav className="navbar__nav" role="navigation" aria-label="Main navigation">
          <ul className="navbar__menu">
            {!isLoggedIn ? (
              // Public menu items
              <>
                <li className="navbar__item">
                  <NavLink to="/about" className="navbar__link">
                    About
                  </NavLink>
                </li>
                <li className="navbar__item">
                  <NavLink to="/team" className="navbar__link">
                    Team
                  </NavLink>
                </li>
                <li className="navbar__item">
                  <NavLink to="/patents" className="navbar__link">
                    Patents
                  </NavLink>
                </li>
                <li className="navbar__item">
                  <NavLink to="/login" className="navbar__link navbar__link--login">
                    Log In
                  </NavLink>
                </li>
                <li className="navbar__item">
                  <NavLink to="/signup" className="navbar__link navbar__link--signup">
                    Sign Up
                  </NavLink>
                </li>
              </>
            ) : (
              // Logged in menu items
              <>
                <li className="navbar__item">
                  <NavLink to="/dashboard" className="navbar__link">
                    Dashboard
                  </NavLink>
                </li>
                <li className="navbar__item navbar__item--user">
                  <span className="navbar__user-name">{userName}</span>
                </li>
                <li className="navbar__item">
                  <button 
                    className="navbar__logout-btn" 
                    onClick={onLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="navbar__mobile-toggle" 
          aria-label="Toggle navigation menu"
          aria-expanded="false"
        >
          <span className="navbar__hamburger"></span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
