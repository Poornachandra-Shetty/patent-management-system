/**
 * Container Component
 * Centered single-column layout as per UI reference
 */

import './Container.css'

function Container({
  children,
  size = 'default',
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component 
      className={`container container--${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Container
