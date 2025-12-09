/**
 * Button component - Consistent button styling across the app
 */

const variants = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
  outline: 'bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700'
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  ...props 
}) {
  const baseClass = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 inline-flex items-center justify-center gap-2'
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${disabledClass} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
      {iconRight}
    </button>
  )
}
