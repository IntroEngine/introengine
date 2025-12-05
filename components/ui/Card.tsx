import React from 'react'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  hover?: boolean
  bordered?: boolean
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  hover = false,
  bordered = true,
}) => {
  const baseStyles = 'rounded-lg bg-card-bg'
  const borderStyles = bordered ? 'border border-card-border' : ''
  const hoverStyles = hover ? 'transition-shadow hover:shadow-lg' : ''
  const paddingStyles = 'p-6'
  
  const classes = `${baseStyles} ${borderStyles} ${hoverStyles} ${paddingStyles} ${className}`
  
  return (
    <div className={classes}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {title}
        </h3>
      )}
      <div className="text-foreground">
        {children}
      </div>
    </div>
  )
}

export default Card

