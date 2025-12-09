/**
 * Modal component - Reusable modal dialog
 */

export function Modal({ 
  children, 
  onClose, 
  size = 'md',
  className = '' 
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ children, onClose, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function ModalContent({ children, className = '' }) {
  return (
    <div className={`p-6 overflow-y-auto flex-1 ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}
