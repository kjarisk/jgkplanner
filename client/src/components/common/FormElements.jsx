/**
 * Form elements - Input, Select, Checkbox with consistent styling
 */

export function Input({ 
  label,
  error,
  className = '',
  containerClassName = '',
  ...props 
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm 
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500' : ''} 
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function Select({ 
  label,
  error,
  options = [],
  placeholder,
  className = '',
  containerClassName = '',
  ...props 
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm 
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500' : ''} 
          ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export function Checkbox({ 
  label,
  className = '',
  ...props 
}) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300 text-teal-600 
          focus:ring-teal-500 focus:ring-offset-0"
        {...props}
      />
      {label && (
        <span className="text-sm text-gray-700">{label}</span>
      )}
    </label>
  )
}
