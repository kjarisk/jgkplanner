/**
 * StatCard component - Display a single statistic with label
 */

export function StatCard({ 
  label, 
  value, 
  subValue,
  variant = 'default',
  icon,
  className = '' 
}) {
  const variants = {
    default: 'bg-white',
    success: 'bg-green-50',
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
    info: 'bg-sky-50',
    dark: 'bg-slate-100'
  }

  const textVariants = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-sky-600',
    dark: 'text-slate-800'
  }

  return (
    <div className={`rounded-lg p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${textVariants[variant]}`}>
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-gray-500 mt-1">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">{icon}</div>
        )}
      </div>
    </div>
  )
}
