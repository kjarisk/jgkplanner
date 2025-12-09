/**
 * EmptyState component - Display when there's no data
 */

export function EmptyState({ 
  title = 'No data',
  description,
  icon,
  action,
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-300 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
