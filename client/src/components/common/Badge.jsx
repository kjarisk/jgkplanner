/**
 * Badge component - Small label/tag for status or category
 */

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700'
}

export function Badge({ 
  children, 
  variant = 'default',
  color,
  size = 'sm',
  className = '' 
}) {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  }

  // If custom color is provided, use it
  const colorStyle = color 
    ? { backgroundColor: `${color}20`, color } 
    : {}

  const variantClass = color ? '' : variants[variant]

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizes[size]} ${variantClass} ${className}`}
      style={colorStyle}
    >
      {color && (
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  )
}
