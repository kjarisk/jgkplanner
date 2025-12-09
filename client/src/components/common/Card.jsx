/**
 * Card component - A flexible container with optional header and footer
 */

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', actions, ...props }) {
  return (
    <div 
      className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${className}`}
      {...props}
    >
      <div className="font-semibold text-gray-900 text-base">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardContent({ children, className = '', noPadding = false, ...props }) {
  return (
    <div 
      className={`${noPadding ? '' : 'p-4'} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div 
      className={`px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
