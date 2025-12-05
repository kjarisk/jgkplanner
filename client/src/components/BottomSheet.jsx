import { useEffect, useRef } from 'react'
import { formatDate } from '../utils/date'

export default function BottomSheet({ date, activities, trainingTypes, onClose, onAction }) {
  const sheetRef = useRef(null)
  const startY = useRef(null)
  
  // Create type info map
  const typeInfo = {}
  trainingTypes.forEach(type => {
    typeInfo[type.id] = { color: type.color, name: type.name }
  })
  
  // Handle touch start for drag-to-close
  function handleTouchStart(e) {
    startY.current = e.touches[0].clientY
  }
  
  // Handle touch move for drag-to-close
  function handleTouchMove(e) {
    if (!startY.current || !sheetRef.current) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`
    }
  }
  
  // Handle touch end for drag-to-close
  function handleTouchEnd(e) {
    if (!startY.current || !sheetRef.current) return
    
    const endY = e.changedTouches[0].clientY
    const diff = endY - startY.current
    
    if (diff > 100) {
      // Close if dragged down more than 100px
      onClose()
    } else {
      // Reset position
      sheetRef.current.style.transform = ''
    }
    
    startY.current = null
  }
  
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-slideUp max-h-[80vh] overflow-hidden transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-4 pb-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {formatDate(date)}
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Add Activity Button */}
          <button
            onClick={() => onAction('add')}
            className="w-full p-4 mb-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-medium flex items-center justify-center gap-2 hover:bg-teal-50 active:bg-teal-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Activity
          </button>
          
          {/* Activities List */}
          {activities.length > 0 && (
            <>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                {activities.length} Activity(s)
              </div>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => onAction('edit', activity)}
                    className="w-full p-4 rounded-xl flex items-center gap-4 hover:brightness-95 active:scale-[0.98] transition-all text-white"
                    style={{ backgroundColor: typeInfo[activity.training_type_id]?.color || '#64748b' }}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-semibold">
                        {typeInfo[activity.training_type_id]?.name || 'Unknown'}
                      </div>
                      <div className="text-sm opacity-90 mt-1 space-x-2">
                        {activity.start_time && (
                          <span>{activity.start_time}</span>
                        )}
                        {activity.trainer_name && (
                          <span>- {activity.trainer_name}</span>
                        )}
                        {activity.hours && (
                          <span>- {activity.hours}t</span>
                        )}
                      </div>
                      {activity.series_id && (
                        <div className="text-xs opacity-75 mt-1">Recurring</div>
                      )}
                    </div>
                    <svg className="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No activities scheduled
            </div>
          )}
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  )
}

