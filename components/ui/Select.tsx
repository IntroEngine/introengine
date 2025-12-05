import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    const baseStyles = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 transition-colors'
    const borderStyles = error
      ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
    
    const classes = `${baseStyles} ${borderStyles} ${className}`
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={classes}
          {...props}
        >
          {!props.required && (
            <option value="">Selecciona una opción</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'

export default Select

