/**
 * ActivityDetail - Modal showing detailed activity information
 */

import { WEEKDAYS_FULL } from '../../utils/date'

export default function ActivityDetail({ activity, rowData, viewMode, onClose }) {
  // Get all activities from the row data
  const activities = rowData?.activities || []
  
  // Group activities by month for better organization
  const groupedByMonth = activities.reduce((acc, act) => {
    const date = new Date(act.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: date.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' }),
        activities: []
      }
    }
    acc[monthKey].activities.push(act)
    return acc
  }, {})
  
  const monthGroups = Object.values(groupedByMonth)
  
  // Calculate summary
  const totalActivities = activities.length
  const totalHours = activities.reduce((sum, a) => sum + (a.hours || 0), 0)
  const weekSpan = rowData?.weeks?.length || 0

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {viewMode === 'type' && rowData?.color && (
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: rowData.color }}
              />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {rowData?.name || 'Aktivitetsdetaljer'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-gray-900">{totalActivities}</div>
                <div className="text-sm text-gray-500 mt-1">Aktiviteter</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-gray-900">{totalHours}</div>
                <div className="text-sm text-gray-500 mt-1">Timer totalt</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-gray-900">{weekSpan}</div>
                <div className="text-sm text-gray-500 mt-1">Uker</div>
              </div>
            </div>
            
            {/* Activity list grouped by month */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Alle aktiviteter
              </h3>
              {monthGroups.map((group, idx) => (
                <div key={idx}>
                  <h4 className="text-base font-semibold text-gray-800 mb-3 capitalize">
                    {group.month}
                  </h4>
                  <div className="space-y-2">
                    {group.activities.map((act) => {
                      const date = new Date(act.date)
                      const dayName = WEEKDAYS_FULL[date.getDay()]
                      
                      return (
                        <div 
                          key={act.id}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-gray-400 w-16 text-xs font-medium">
                              Uke {act.week}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800">
                                {date.getDate()}. {date.toLocaleDateString('no-NO', { month: 'short' })}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {dayName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-gray-600">
                            {act.start_time && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded font-medium">
                                {act.start_time}
                              </span>
                            )}
                            <span className="font-medium">{act.hours || 0}t</span>
                            {viewMode === 'trainer' && act.type_name && (
                              <span 
                                className="text-xs px-2 py-1 rounded font-medium"
                                style={{ 
                                  backgroundColor: `${act.type_color}20`,
                                  color: act.type_color
                                }}
                              >
                                {act.type_name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
