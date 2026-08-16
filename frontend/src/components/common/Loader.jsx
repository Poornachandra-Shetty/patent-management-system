/**
 * Loader Component
 * Displays a loading spinner with optional message
 */

import './Loader.css'

function Loader({ message = 'Loading...', fullScreen = false }) {
  const loaderClass = fullScreen ? 'loader--fullscreen' : 'loader'

  return (
    <div className={loaderClass}>
      <div className="loader__spinner"></div>
      {message && <p className="loader__message">{message}</p>}
    </div>
  )
}

export default Loader
