/**
 * Table components - Flexible table with consistent styling
 */

export function Table({ children, className = '', compact = false, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead {...props}>
      <tr className={`text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 ${className}`}>
        {children}
      </tr>
    </thead>
  )
}

export function TableRow({ 
  children, 
  className = '', 
  onClick, 
  hoverable = false,
  highlight = false,
  ...props 
}) {
  const baseClass = 'border-b border-gray-100 last:border-b-0'
  const hoverClass = hoverable || onClick ? 'hover:bg-gray-50 cursor-pointer' : ''
  const highlightClass = highlight ? 'bg-teal-50' : ''
  
  return (
    <tr 
      className={`${baseClass} ${hoverClass} ${highlightClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableCell({ 
  children, 
  className = '', 
  header = false,
  align = 'left',
  ...props 
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align]
  
  if (header) {
    return (
      <th className={`px-4 py-3 font-medium ${alignClass} ${className}`} {...props}>
        {children}
      </th>
    )
  }
  
  return (
    <td className={`px-4 py-4 ${alignClass} ${className}`} {...props}>
      {children}
    </td>
  )
}
