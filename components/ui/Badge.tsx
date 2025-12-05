import React from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  
  const variants = {
    success: 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
    error: 'bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-400',
    info: 'bg-info-50 text-info-600 dark:bg-info-900/30 dark:text-info-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }
  
  const classes = `${baseStyles} ${variants[variant]} ${className}`
  
  return (
    <span className={classes}>
      {children}
    </span>
  )
}

export default Badge

