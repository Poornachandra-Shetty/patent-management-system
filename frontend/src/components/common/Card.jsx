/**
 * Card Component
 * Reusable card container for content sections
 */

import './Card.css'

function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'medium',
  shadow = 'medium',
  hoverable = false,
  className = '',
  onClick,
  ...props
}) {
  const classNames = [
    'card',
    `card--padding-${padding}`,
    `card--shadow-${shadow}`,
    hoverable ? 'card--hoverable' : '',
    onClick ? 'card--clickable' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={classNames} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="card__header">
          <div className="card__header-text">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__content">
        {children}
      </div>
    </div>
  )
}

export default Card
