import { useMemo, useState } from 'react'

const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'Agust', 'Sept', 'Okt', 'Nov', 'Des'
]

const WEEKDAYS = ['Son', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor']

// Get the day of week (0=Sunday) for the first day of a month
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// Get the number of days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// Calculate max columns needed for a year (to avoid empty columns)
function getMaxColumnsForYear(year) {
  let maxCols = 0
  for (let month = 0; month < 12; month++) {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const colsNeeded = firstDay + daysInMonth
    if (colsNeeded > maxCols) maxCols = colsNeeded
  }
  return maxCols
}

// Generate the calendar data for a year
function generateYearCalendar(year) {
  const maxCols = getMaxColumnsForYear(year)
  const months = []
  
  for (let month = 0; month < 12; month++) {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const days = []
    
    for (let i = 0; i < maxCols; i++) {
      const dayOfWeek = i % 7
      const dayNumber = i - firstDay + 1
      
      if (dayNumber >= 1 && dayNumber <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
        days.push({
          day: dayNumber,
          dayOfWeek,
          date: dateStr,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6
        })
      } else {
        days.push({
          day: null,
          dayOfWeek,
          date: null,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6
        })
      }
    }
    
    months.push({
      name: MONTHS[month],
      month,
      days
    })
  }
  
  return { months, maxCols }
}

// Get activities map by date
function getActivitiesMap(activities) {
  const map = {}
  activities.forEach(activity => {
    if (!map[activity.date]) {
      map[activity.date] = []
    }
    map[activity.date].push(activity)
  })
  return map
}

export default function Calendar({ year, activities, trainingTypes, onCellClick, onAddActivity, canEdit }) {
  const { months: calendar, maxCols } = useMemo(() => generateYearCalendar(year), [year])
  const activitiesMap = useMemo(() => getActivitiesMap(activities), [activities])
  const [contextMenu, setContextMenu] = useState(null)
  
  // Create a map of type colors
  const typeColors = useMemo(() => {
    const colors = {}
    trainingTypes.forEach(type => {
      colors[type.id] = type.color
    })
    return colors
  }, [trainingTypes])

  // Generate weekday header row based on maxCols
  const weekdayHeaders = []
  for (let i = 0; i < maxCols; i++) {
    const dayOfWeek = i % 7
    weekdayHeaders.push({
      name: WEEKDAYS[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    })
  }

  // Handle right-click for context menu
  function handleContextMenu(e, date, dayActivities) {
    if (!canEdit || !date) return
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      date,
      activities: dayActivities
    })
  }

  // Close context menu
  function closeContextMenu() {
    setContextMenu(null)
  }

  // Handle cell click - show activities or add new
  function handleCellClick(date, dayActivities, clickedActivityIndex = null) {
    if (!date) return
    closeContextMenu()
    
    if (clickedActivityIndex !== null && dayActivities[clickedActivityIndex]) {
      // Clicked on specific activity color segment
      onCellClick(date, dayActivities[clickedActivityIndex])
    } else {
      // Clicked on cell in general
      onCellClick(date, null, dayActivities)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" onClick={closeContextMenu}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {/* Month column header */}
              <th className="sticky left-0 z-10 bg-gray-100 border border-gray-300 px-2 py-1 font-semibold text-gray-700 min-w-[60px]">
                
              </th>
              {/* Weekday headers */}
              {weekdayHeaders.map((header, i) => (
                <th
                  key={i}
                  className={`border border-gray-300 px-1 py-1 font-medium text-[10px] min-w-[28px] ${
                    header.isWeekend ? 'bg-weekend text-gray-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {header.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.map((monthData) => (
              <tr key={monthData.name}>
                {/* Month name */}
                <td className="sticky left-0 z-10 bg-gray-50 border border-gray-300 px-2 py-2 font-semibold text-gray-700 text-sm">
                  {monthData.name}
                </td>
                {/* Day cells */}
                {monthData.days.map((dayData, dayIndex) => {
                  const dayActivities = dayData.date ? activitiesMap[dayData.date] || [] : []
                  const hasActivities = dayActivities.length > 0
                  const hasMultiple = dayActivities.length > 1
                  
                  return (
                    <td
                      key={dayIndex}
                      onContextMenu={(e) => handleContextMenu(e, dayData.date, dayActivities)}
                      className={`
                        border border-gray-200 text-center relative h-8 min-w-[28px] p-0
                        ${dayData.isWeekend ? 'bg-weekend' : 'bg-white'}
                        ${!dayData.day ? 'bg-gray-50' : ''}
                      `}
                    >
                      {dayData.day && (
                        <div className="w-full h-full relative">
                          {/* Multiple activities - split cell */}
                          {hasMultiple ? (
                            <>
                              <div className="absolute inset-0 flex">
                                {dayActivities.slice(0, 3).map((activity, i) => (
                                  <div
                                    key={activity.id}
                                    onClick={() => canEdit && handleCellClick(dayData.date, dayActivities, i)}
                                    className={`flex-1 h-full cursor-pointer hover:brightness-90 transition-all ${
                                      i < dayActivities.length - 1 ? 'border-r border-white/50' : ''
                                    }`}
                                    style={{ backgroundColor: typeColors[activity.training_type_id] }}
                                    title={`${activity.type_name}${activity.start_time ? ' @ ' + activity.start_time : ''}`}
                                  />
                                ))}
                              </div>
                              {/* Centered day number */}
                              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white drop-shadow-sm pointer-events-none">
                                {dayData.day}
                              </span>
                              {dayActivities.length > 3 && (
                                <div 
                                  className="absolute bottom-0 right-0 text-[8px] text-white bg-black/50 px-0.5 rounded-tl"
                                  onClick={() => canEdit && handleCellClick(dayData.date, dayActivities)}
                                >
                                  +{dayActivities.length - 3}
                                </div>
                              )}
                            </>
                          ) : hasActivities ? (
                            /* Single activity - full cell color */
                            <div
                              onClick={() => canEdit && handleCellClick(dayData.date, dayActivities, 0)}
                              className="absolute inset-0 cursor-pointer hover:brightness-90 transition-all flex items-center justify-center"
                              style={{ backgroundColor: typeColors[dayActivities[0].training_type_id] }}
                              title={`${dayActivities[0].type_name}${dayActivities[0].start_time ? ' @ ' + dayActivities[0].start_time : ''}`}
                            >
                              <span className="text-[11px] font-medium text-white drop-shadow-sm">
                                {dayData.day}
                              </span>
                            </div>
                          ) : (
                            /* No activity - just show date */
                            <div
                              onClick={() => canEdit && handleCellClick(dayData.date, dayActivities)}
                              className={`absolute inset-0 flex items-center justify-center ${canEdit ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            >
                              <span className="text-[11px] font-medium text-gray-700">
                                {dayData.day}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Context Menu Backdrop */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeContextMenu}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[220px] overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Date Header */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {new Date(contextMenu.date).toLocaleDateString('no-NO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <button 
              onClick={closeContextMenu}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                onAddActivity(contextMenu.date)
                closeContextMenu()
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <span className="text-teal-600 font-bold">+</span>
              <span>Create Activity</span>
            </button>
            {contextMenu.activities.length > 0 && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <div className="px-4 py-1 text-xs text-gray-500">
                  {contextMenu.activities.length} activity(s) on this day
                </div>
                {contextMenu.activities.map((activity, i) => (
                  <button
                    key={activity.id}
                    onClick={() => {
                      handleCellClick(contextMenu.date, contextMenu.activities, i)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span 
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: typeColors[activity.training_type_id] }}
                    />
                    <span className="flex-1">{activity.type_name}</span>
                    {activity.start_time && (
                      <span className="text-xs text-gray-500">{activity.start_time}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          {trainingTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: type.color }}
              />
              <span className="text-xs text-gray-600">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
