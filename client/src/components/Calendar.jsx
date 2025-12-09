import { useMemo, useState, useRef, useEffect } from 'react'

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

export default function Calendar({ 
  year, 
  activities, 
  trainingTypes, 
  onCellClick, 
  onAddActivity, 
  canEdit,
  viewMode = 'year',
  selectedMonth = new Date().getMonth(),
  selectedWeekStart,
  onViewModeChange,
  onMonthChange,
  onWeekChange,
  ghostDates = [],
  ghostTypeId = null,
  copiedWeek,
  onCopyWeek,
  onPasteWeek
}) {
  const { months: calendar, maxCols } = useMemo(() => generateYearCalendar(year), [year])
  const activitiesMap = useMemo(() => getActivitiesMap(activities), [activities])
  const [contextMenu, setContextMenu] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [legendCollapsed, setLegendCollapsed] = useState(true)
  const [hoveredMonth, setHoveredMonth] = useState(null)
  const monthRefs = useRef({})
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const [conflictTooltip, setConflictTooltip] = useState(null)
  
  // Calculate trainer conflicts for a day (time overlap check)
  const getTrainerConflicts = (dayActivities) => {
    const conflicts = []
    for (let i = 0; i < dayActivities.length; i++) {
      for (let j = i + 1; j < dayActivities.length; j++) {
        const a1 = dayActivities[i]
        const a2 = dayActivities[j]
        
        // Only check if same trainer
        if (a1.trainer_id && a1.trainer_id === a2.trainer_id) {
          // Check time overlap
          const start1 = a1.start_time ? parseFloat(a1.start_time.replace(':', '.')) : 0
          const end1 = start1 + (a1.hours || 1)
          const start2 = a2.start_time ? parseFloat(a2.start_time.replace(':', '.')) : 0
          const end2 = start2 + (a2.hours || 1)
          
          // Check for overlap
          if (!(end1 <= start2 || end2 <= start1)) {
            conflicts.push({
              trainer: a1.trainer_name || 'Unknown trainer',
              activity1: typeInfo[a1.training_type_id]?.name || 'Activity',
              activity2: typeInfo[a2.training_type_id]?.name || 'Activity',
              time1: a1.start_time || 'No time',
              time2: a2.start_time || 'No time'
            })
          }
        }
      }
    }
    return conflicts
  }
  
  // Handle swipe for month/week navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  
  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    
    // Only trigger if horizontal swipe is stronger than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (viewMode === 'month' && onMonthChange) {
        if (deltaX > 0) {
          onMonthChange(Math.max(0, selectedMonth - 1))
        } else {
          onMonthChange(Math.min(11, selectedMonth + 1))
        }
      } else if (viewMode === 'week' && onWeekChange && selectedWeekStart) {
        const newWeek = new Date(selectedWeekStart)
        if (deltaX > 0) {
          newWeek.setDate(newWeek.getDate() - 7)
        } else {
          newWeek.setDate(newWeek.getDate() + 7)
        }
        onWeekChange(newWeek)
      }
    }
    
    touchStartX.current = null
    touchStartY.current = null
  }
  
  // Today's date info
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
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
      {/* Header with View Toggle and Month Quick Jump */}
      <div className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center gap-3">
        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex bg-slate-600/50 rounded-lg p-0.5 mr-2">
            {['year', 'month', 'week'].map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                  viewMode === mode
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {mode === 'year' ? 'Year' : mode === 'month' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
        )}
        
        {/* Today Button */}
        <button
          onClick={() => {
            if (viewMode === 'year') {
              scrollToMonth(currentMonth)
            } else if (viewMode === 'month' && onMonthChange) {
              onMonthChange(currentMonth)
            } else if (viewMode === 'week' && onWeekChange) {
              const todayDate = new Date()
              const dayOfWeek = todayDate.getDay()
              todayDate.setDate(todayDate.getDate() - dayOfWeek)
              onWeekChange(todayDate)
            }
          }}
          className="px-3 py-1 text-xs font-medium rounded-full bg-teal-600 text-white hover:bg-teal-500 transition-all"
        >
          Today
        </button>
        
        {/* Month/Week Navigation (for month/week views) */}
        {viewMode === 'month' && onMonthChange && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onMonthChange(Math.max(0, selectedMonth - 1))}
              className="p-1 text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white text-sm font-medium min-w-[80px] text-center">
              {MONTHS[selectedMonth]}
            </span>
            <button
              onClick={() => onMonthChange(Math.min(11, selectedMonth + 1))}
              className="p-1 text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Month Quick Jump (year view only) */}
        {viewMode === 'year' && (
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            {MONTHS.map((month, i) => (
              <button
                key={month}
                onClick={() => scrollToMonth(i)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  isCurrentYear && i === currentMonth
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {month.substring(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Year View */}
      {viewMode === 'year' && (
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
                    const isGhostDate = dayData.date && ghostDates.includes(dayData.date)
                    const conflicts = canEdit && dayActivities.length > 1 ? getTrainerConflicts(dayActivities) : []
                    const hasConflict = conflicts.length > 0
                    
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
                            ) : isGhostDate ? (
                              /* Ghost date for recurring preview */
                              <div
                                className="absolute inset-0.5 flex items-center justify-center rounded-sm opacity-40 border-2 border-dashed"
                                style={{ 
                                  backgroundColor: ghostTypeId && typeInfo[ghostTypeId]?.color || '#64748b',
                                  borderColor: ghostTypeId && typeInfo[ghostTypeId]?.color || '#64748b'
                                }}
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
                            {/* Conflict Warning Icon */}
                            {hasConflict && (
                              <div
                                className="absolute top-0 right-0 z-10 cursor-help"
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setConflictTooltip({
                                    x: rect.left,
                                    y: rect.bottom + 5,
                                    conflicts
                                  })
                                }}
                                onMouseLeave={() => setConflictTooltip(null)}
                              >
                                <svg className="w-3.5 h-3.5 text-red-500 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
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
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div 
          className="p-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-7 gap-2">
            {/* Month Header */}
            {WEEKDAYS.map((day, i) => (
              <div key={day} className={`text-center py-2 text-sm font-semibold ${
                i === 0 || i === 6 ? 'text-amber-600' : 'text-slate-600'
              }`}>
                {day}
              </div>
            ))}
            
            {/* Month Days */}
            {(() => {
              const daysInMonth = getDaysInMonth(year, selectedMonth)
              const firstDay = getFirstDayOfMonth(year, selectedMonth)
              const cells = []
              
              // Empty cells before first day
              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 rounded-lg" />)
              }
              
              // Day cells
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayActivities = activitiesMap[dateStr] || []
                const isToday = dateStr === todayStr
                const isGhost = ghostDates.includes(dateStr)
                
                cells.push(
                  <div 
                    key={day}
                    onClick={() => canEdit && onCellClick(dateStr, null, dayActivities)}
                    onDoubleClick={() => canEdit && dayActivities.length === 0 && onAddActivity(dateStr)}
                    className={`h-24 border rounded-lg p-2 transition-all ${
                      isToday ? 'ring-2 ring-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
                    } ${canEdit ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-teal-700' : 'text-slate-700'}`}>
                      {day}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {dayActivities.slice(0, 3).map((activity) => (
                        <div 
                          key={activity.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: typeInfo[activity.training_type_id]?.color }}
                        >
                          {activity.start_time && `${activity.start_time} `}
                          {typeInfo[activity.training_type_id]?.name}
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                        <div className="text-xs text-slate-500">+{dayActivities.length - 3} more</div>
                      )}
                      {isGhost && (
                        <div 
                          className="text-xs px-1.5 py-0.5 rounded truncate text-white opacity-50 border-2 border-dashed"
                          style={{ backgroundColor: typeInfo[ghostTypeId]?.color || '#64748b' }}
                        >
                          Preview
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              return cells
            })()}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && selectedWeekStart && (
        <div 
          className="p-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Copy/Paste Week Buttons */}
          {canEdit && (
            <div className="flex justify-end gap-2 mb-3">
              <button
                onClick={() => onCopyWeek && onCopyWeek(selectedWeekStart, getWeekNumber(selectedWeekStart))}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Week
              </button>
              {copiedWeek && (
                <button
                  onClick={() => onPasteWeek && onPasteWeek(selectedWeekStart, getWeekNumber(selectedWeekStart))}
                  className="px-3 py-1.5 text-sm bg-teal-500 text-white hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Paste Week (from Week {copiedWeek.weekNumber})
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-7 gap-3">
            {/* Week Days */}
            {Array.from({ length: 7 }, (_, i) => {
              const dayDate = new Date(selectedWeekStart)
              dayDate.setDate(dayDate.getDate() + i)
              const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
              const dayActivities = activitiesMap[dateStr] || []
              const isToday = dateStr === todayStr
              const isWeekend = i === 0 || i === 6
              
              return (
                <div key={i} className="flex flex-col">
                  {/* Day Header */}
                  <div className={`text-center py-2 rounded-t-lg ${
                    isWeekend ? 'bg-amber-50' : 'bg-slate-100'
                  }`}>
                    <div className={`text-xs font-medium ${isWeekend ? 'text-amber-600' : 'text-slate-500'}`}>
                      {WEEKDAYS[i]}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday ? 'text-teal-600' : isWeekend ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {dayDate.getDate()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {MONTHS[dayDate.getMonth()].substring(0, 3)}
                    </div>
                  </div>
                  
                  {/* Day Content */}
                  <div 
                    onClick={() => canEdit && onCellClick(dateStr, null, dayActivities)}
                    onDoubleClick={() => canEdit && dayActivities.length === 0 && onAddActivity(dateStr)}
                    className={`flex-1 min-h-[200px] border rounded-b-lg p-2 space-y-2 ${
                      isToday ? 'ring-2 ring-teal-500 bg-teal-50/30' : 'border-slate-200'
                    } ${canEdit ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  >
                    {dayActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onCellClick(dateStr, activity, dayActivities)
                        }}
                        className="p-2 rounded-lg text-white text-sm hover:brightness-95 transition-all cursor-pointer"
                        style={{ backgroundColor: typeInfo[activity.training_type_id]?.color }}
                      >
                        <div className="font-semibold">
                          {typeInfo[activity.training_type_id]?.name}
                        </div>
                        {activity.start_time && (
                          <div className="text-xs opacity-90 mt-1">{activity.start_time}</div>
                        )}
                        {(activity.trainer_names || activity.trainer_name) && (
                          <div className="text-xs opacity-75">{activity.trainer_names || activity.trainer_name}</div>
                        )}
                      </div>
                    ))}
                    {dayActivities.length === 0 && (
                      <div className="h-full flex items-center justify-center text-slate-300 text-sm">
                        {canEdit ? 'Double-click to add' : 'No activities'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Week Navigation */}
          {onWeekChange && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => {
                  const newWeek = new Date(selectedWeekStart)
                  newWeek.setDate(newWeek.getDate() - 7)
                  onWeekChange(newWeek)
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Week
              </button>
              <span className="text-sm text-slate-600 font-medium">
                Week {getWeekNumber(selectedWeekStart)}
              </span>
              <button
                onClick={() => {
                  const newWeek = new Date(selectedWeekStart)
                  newWeek.setDate(newWeek.getDate() + 7)
                  onWeekChange(newWeek)
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                Next Week
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

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
              {(tooltip.activity.trainer_names || tooltip.activity.trainer_name) && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {tooltip.activity.trainer_names || tooltip.activity.trainer_name}
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
      
      {/* Conflict Tooltip */}
      {conflictTooltip && (
        <div
          className="fixed z-50 animate-fadeIn"
          style={{
            left: conflictTooltip.x,
            top: conflictTooltip.y
          }}
        >
          <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-xl text-sm max-w-xs">
            <div className="font-semibold mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Trainer Conflict
            </div>
            {conflictTooltip.conflicts.map((c, i) => (
              <div key={i} className="text-xs mt-1 text-red-100">
                <span className="font-medium">{c.trainer}</span>: {c.activity1} ({c.time1}) overlaps with {c.activity2} ({c.time2})
              </div>
            ))}
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