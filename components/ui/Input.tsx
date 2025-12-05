import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseStyles = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors'
    const borderStyles = error
      ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
    
    const classes = `${baseStyles} ${borderStyles} ${className}`
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

