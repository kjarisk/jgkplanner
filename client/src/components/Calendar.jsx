import { useMemo, useState, useRef } from 'react'

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

// Get ISO week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Calculate max columns needed for a year
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
    const weekNumbersInRow = {} // Track week numbers at Sunday positions
    
    for (let i = 0; i < maxCols; i++) {
      const dayOfWeek = i % 7
      const dayNumber = i - firstDay + 1
      
      if (dayNumber >= 1 && dayNumber <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
        const date = new Date(year, month, dayNumber)
        const weekNum = getWeekNumber(date)
        
        // Store week number at Sunday position
        if (dayOfWeek === 0) {
          weekNumbersInRow[i] = weekNum
        }
        
        days.push({
          day: dayNumber,
          dayOfWeek,
          date: dateStr,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isWeekStart: dayOfWeek === 0,
          weekNumber: weekNum
        })
      } else {
        // Check if this empty Sunday should show a week number (for days before month starts)
        if (dayOfWeek === 0 && i < firstDay && month === 0) {
          // First month, before it starts - show previous year's week
          const prevYearDate = new Date(year - 1, 11, 31 - (firstDay - i - 1))
          weekNumbersInRow[i] = getWeekNumber(prevYearDate)
        }
        
        days.push({
          day: null,
          dayOfWeek,
          date: null,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isWeekStart: dayOfWeek === 0,
          weekNumber: null
        })
      }
    }
    
    months.push({
      name: MONTHS[month],
      month,
      days,
      weekNumbersInRow
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
  const [tooltip, setTooltip] = useState(null)
  const [legendCollapsed, setLegendCollapsed] = useState(true)
  const [hoveredMonth, setHoveredMonth] = useState(null)
  const monthRefs = useRef({})
  
  // Today's date info
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const isCurrentYear = year === currentYear
  
  // Create a map of type colors and names
  const typeInfo = useMemo(() => {
    const info = {}
    trainingTypes.forEach(type => {
      info[type.id] = { color: type.color, name: type.name }
    })
    return info
  }, [trainingTypes])

  // Generate weekday header row based on maxCols
  const weekdayHeaders = useMemo(() => {
    const headers = []
    for (let i = 0; i < maxCols; i++) {
      const dayOfWeek = i % 7
      headers.push({
        name: WEEKDAYS[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isWeekStart: dayOfWeek === 0
      })
    }
    return headers
  }, [maxCols])

  // Handle right-click for context menu
  function handleContextMenu(e, date, dayActivities) {
    if (!canEdit || !date) return
    e.preventDefault()
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 250),
      y: Math.min(e.clientY, window.innerHeight - 300),
      date,
      activities: dayActivities
    })
    setTooltip(null)
  }

  // Close context menu
  function closeContextMenu() {
    setContextMenu(null)
  }

  // Handle tooltip
  function showTooltip(e, activity) {
    if (contextMenu) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      activity
    })
  }

  function hideTooltip() {
    setTooltip(null)
  }

  // Handle cell click
  function handleCellClick(date, dayActivities, clickedActivityIndex = null) {
    if (!date) return
    closeContextMenu()
    
    if (clickedActivityIndex !== null && dayActivities[clickedActivityIndex]) {
      onCellClick(date, dayActivities[clickedActivityIndex])
    } else {
      onCellClick(date, null, dayActivities)
    }
  }

  // Scroll to month
  function scrollToMonth(monthIndex) {
    const ref = monthRefs.current[monthIndex]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn" onClick={closeContextMenu}>
      {/* Month Quick Jump */}
      <div className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center gap-1 overflow-x-auto">
        {MONTHS.map((month, i) => (
          <button
            key={month}
            onClick={() => scrollToMonth(i)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              isCurrentYear && i === currentMonth
                ? 'bg-teal-500 text-white'
                : 'text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            {month.substring(0, 3)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }} />
            <col style={{ width: '35px', minWidth: '35px', maxWidth: '35px' }} />
            {weekdayHeaders.map((_, i) => (
              <col key={i} style={{ minWidth: '36px' }} />
            ))}
          </colgroup>
          <thead>
            {/* Weekday headers row */}
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 border-b border-r border-slate-200 px-2 py-1 font-semibold text-slate-600">
                
              </th>
              <th className="sticky left-[80px] z-20 bg-slate-100 border-b border-r border-slate-200 px-0.5 py-1 font-medium text-[10px] text-slate-500">
                Uke
              </th>
              {weekdayHeaders.map((header, i) => (
                <th
                  key={i}
                  className={`border-b border-slate-200 px-0.5 py-1 font-semibold text-[10px] transition-colors ${
                    header.isWeekend 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'bg-slate-50 text-slate-500'
                  } ${header.isWeekStart ? 'border-l-2 border-l-slate-300' : ''}`}
                >
                  {header.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.map((monthData, monthIndex) => {
              const isThisMonth = isCurrentYear && monthIndex === currentMonth
              
              // Get week numbers for this month's row
              const weekNumsForRow = []
              monthData.days.forEach((day, i) => {
                if (day.isWeekStart && day.weekNumber) {
                  weekNumsForRow.push(day.weekNumber)
                } else if (day.isWeekStart && monthData.weekNumbersInRow[i]) {
                  weekNumsForRow.push(monthData.weekNumbersInRow[i])
                }
              })
              
              return (
                <tr 
                  key={monthData.name}
                  ref={el => monthRefs.current[monthIndex] = el}
                  className={`transition-colors duration-200 ${
                    hoveredMonth === monthIndex ? 'bg-slate-50/50' : ''
                  } ${isThisMonth ? 'bg-teal-50/30' : ''}`}
                  onMouseEnter={() => setHoveredMonth(monthIndex)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Month name - fixed width */}
                  <td 
                    className={`sticky left-0 z-10 border-b border-r border-slate-200 px-2 py-0.5 font-bold text-sm cursor-pointer transition-colors h-9 ${
                      isThisMonth 
                        ? 'bg-teal-100 text-teal-800' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => scrollToMonth(monthIndex)}
                  >
                    {monthData.name}
                  </td>
                  
                  {/* Week numbers column - shows all week numbers for this month */}
                  <td className="sticky left-[80px] z-10 bg-slate-50 border-b border-r border-slate-200 px-0.5 py-0 text-[8px] text-slate-400 align-middle">
                    <div className="flex flex-wrap justify-center gap-x-1 gap-y-0 leading-none">
                      {weekNumsForRow.map((wn, i) => (
                        <span key={i}>{wn}</span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Day cells */}
                  {monthData.days.map((dayData, dayIndex) => {
                    const dayActivities = dayData.date ? activitiesMap[dayData.date] || [] : []
                    const hasActivities = dayActivities.length > 0
                    const hasMultiple = dayActivities.length > 1
                    const isToday = dayData.date === todayStr
                    
                    return (
                      <td
                        key={dayIndex}
                        onContextMenu={(e) => handleContextMenu(e, dayData.date, dayActivities)}
                        className={`
                          border-b border-slate-100 text-center relative h-9 p-0 transition-all
                          ${dayData.isWeekend ? 'bg-amber-50/50' : 'bg-white'}
                          ${dayData.isWeekStart ? 'border-l-2 border-l-slate-200' : ''}
                          ${!dayData.day ? 'bg-slate-50/30' : ''}
                        `}
                      >
                        {dayData.day && (
                          <div className={`w-full h-full relative ${isToday ? 'ring-2 ring-teal-500 ring-inset rounded-sm' : ''}`}>
                            {/* 3+ activities - 2x2 grid */}
                            {dayActivities.length >= 3 ? (
                              <>
                                <div className="absolute inset-0.5 grid grid-cols-2 grid-rows-2 gap-px rounded-sm overflow-hidden">
                                  {dayActivities.slice(0, 4).map((activity, i) => (
                                    <div
                                      key={activity.id}
                                      onClick={() => canEdit && handleCellClick(dayData.date, dayActivities, i)}
                                      onMouseEnter={(e) => showTooltip(e, activity)}
                                      onMouseLeave={hideTooltip}
                                      className="cursor-pointer hover:brightness-110 transition-all"
                                      style={{ backgroundColor: typeInfo[activity.training_type_id]?.color }}
                                    />
                                  ))}
                                  {dayActivities.length === 3 && (
                                    <div className="bg-slate-200/50" />
                                  )}
                                </div>
                                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow-md pointer-events-none">
                                  {dayData.day}
                                </span>
                                {dayActivities.length > 4 && (
                                  <div className="absolute bottom-0 right-0 text-[7px] text-white bg-black/60 px-0.5 rounded-tl pointer-events-none">
                                    +{dayActivities.length - 4}
                                  </div>
                                )}
                              </>
                            ) : hasMultiple ? (
                              /* 2 activities - split vertically */
                              <>
                                <div className="absolute inset-0.5 flex gap-px rounded-sm overflow-hidden">
                                  {dayActivities.map((activity, i) => (
                                    <div
                                      key={activity.id}
                                      onClick={() => canEdit && handleCellClick(dayData.date, dayActivities, i)}
                                      onMouseEnter={(e) => showTooltip(e, activity)}
                                      onMouseLeave={hideTooltip}
                                      className="flex-1 h-full cursor-pointer hover:brightness-110 transition-all"
                                      style={{ backgroundColor: typeInfo[activity.training_type_id]?.color }}
                                    />
                                  ))}
                                </div>
                                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white drop-shadow-md pointer-events-none">
                                  {dayData.day}
                                </span>
                              </>
                            ) : hasActivities ? (
                              /* Single activity */
                              <div
                                onClick={() => canEdit && handleCellClick(dayData.date, dayActivities, 0)}
                                onMouseEnter={(e) => showTooltip(e, dayActivities[0])}
                                onMouseLeave={hideTooltip}
                                className="absolute inset-0.5 cursor-pointer hover:brightness-110 transition-all flex items-center justify-center rounded-sm"
                                style={{ backgroundColor: typeInfo[dayActivities[0].training_type_id]?.color }}
                              >
                                <span className="text-[11px] font-semibold text-white drop-shadow-md">
                                  {dayData.day}
                                </span>
                              </div>
                            ) : (
                              /* No activity */
                              <div
                                onClick={() => canEdit && handleCellClick(dayData.date, dayActivities)}
                                className={`absolute inset-0 flex items-center justify-center transition-all ${
                                  canEdit ? 'cursor-pointer hover:bg-slate-100' : ''
                                }`}
                              >
                                <span className={`text-[11px] font-semibold ${
                                  isToday ? 'text-teal-700 font-bold' : 'text-slate-600'
                                }`}>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none animate-fadeIn"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm mb-2">
            <div className="font-semibold">{typeInfo[tooltip.activity.training_type_id]?.name}</div>
            <div className="text-slate-300 text-xs mt-1 space-y-0.5">
              {tooltip.activity.start_time && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {tooltip.activity.start_time}
                </div>
              )}
              {tooltip.activity.trainer_name && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {tooltip.activity.trainer_name}
                </div>
              )}
              {tooltip.activity.hours && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {tooltip.activity.hours}h
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-slate-800" />
            </div>
          </div>
        </div>
      )}
      
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
          className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 z-50 min-w-[240px] overflow-hidden animate-slideIn"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Date Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 capitalize">
              {new Date(contextMenu.date).toLocaleDateString('no-NO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <button 
              onClick={closeContextMenu}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="py-2">
            <button
              onClick={() => {
                onAddActivity(contextMenu.date)
                closeContextMenu()
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-teal-50 flex items-center gap-3 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-lg">+</span>
              <span className="font-medium text-slate-700">Create Activity</span>
            </button>
            {contextMenu.activities.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-2" />
                <div className="px-4 py-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {contextMenu.activities.length} activity(s)
                </div>
                {contextMenu.activities.map((activity, i) => (
                  <button
                    key={activity.id}
                    onClick={() => {
                      handleCellClick(contextMenu.date, contextMenu.activities, i)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: typeInfo[activity.training_type_id]?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-700 truncate">{activity.type_name}</div>
                      {activity.start_time && (
                        <div className="text-xs text-slate-400">{activity.start_time}</div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => setLegendCollapsed(!legendCollapsed)}
          className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-sm text-slate-600"
        >
          <span className="font-medium">Legend</span>
          <svg 
            className={`w-4 h-4 transition-transform ${legendCollapsed ? '' : 'rotate-180'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!legendCollapsed && (
          <div className="px-4 py-3 bg-white animate-fadeIn">
            <div className="flex flex-wrap gap-4">
              {trainingTypes.map(type => (
                <div key={type.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-xs text-slate-600">{type.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
