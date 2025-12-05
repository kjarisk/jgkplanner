import { useMemo } from 'react'

const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'Agust', 'Sept', 'Okt', 'Nov', 'Des'
]

const WEEKDAYS = ['Sondag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lordag']

// Get the day of week (0=Sunday) for the first day of a month
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// Get the number of days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// Generate the calendar data for a year
function generateYearCalendar(year) {
  const months = []
  
  for (let month = 0; month < 12; month++) {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    // Calculate total columns needed (we need enough columns for all days)
    // Maximum possible: start on Saturday (6) + 31 days = 37 cells, which is 6 weeks
    const totalCells = 37 // 6 weeks worth of days minus last day
    
    const days = []
    
    for (let i = 0; i < totalCells; i++) {
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
  
  return months
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

export default function Calendar({ year, activities, trainingTypes, onCellClick, canEdit }) {
  const calendar = useMemo(() => generateYearCalendar(year), [year])
  const activitiesMap = useMemo(() => getActivitiesMap(activities), [activities])
  
  // Create a map of type colors
  const typeColors = useMemo(() => {
    const colors = {}
    trainingTypes.forEach(type => {
      colors[type.id] = type.color
    })
    return colors
  }, [trainingTypes])

  // Generate weekday header row
  const weekdayHeaders = []
  for (let week = 0; week < 6; week++) {
    WEEKDAYS.forEach((day, i) => {
      weekdayHeaders.push({
        name: day,
        isWeekend: i === 0 || i === 6
      })
    })
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  {header.name.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.map((monthData, monthIndex) => (
              <tr key={monthData.name}>
                {/* Month name */}
                <td className="sticky left-0 z-10 bg-gray-50 border border-gray-300 px-2 py-2 font-semibold text-gray-700 text-sm">
                  {monthData.name}
                </td>
                {/* Day cells */}
                {monthData.days.map((dayData, dayIndex) => {
                  const dayActivities = dayData.date ? activitiesMap[dayData.date] || [] : []
                  const hasActivities = dayActivities.length > 0
                  
                  // Get primary color (first activity's type color)
                  let cellBgColor = null
                  if (hasActivities) {
                    const primaryActivity = dayActivities[0]
                    cellBgColor = typeColors[primaryActivity.training_type_id]
                  }
                  
                  return (
                    <td
                      key={dayIndex}
                      onClick={() => dayData.date && onCellClick(dayData.date)}
                      className={`
                        border border-gray-200 text-center relative h-8 min-w-[28px]
                        ${dayData.isWeekend ? 'bg-weekend' : 'bg-white'}
                        ${dayData.day ? (canEdit ? 'cursor-pointer hover:brightness-95' : '') : ''}
                        ${!dayData.day ? 'bg-gray-50' : ''}
                      `}
                      style={cellBgColor ? { backgroundColor: cellBgColor } : undefined}
                    >
                      {dayData.day && (
                        <>
                          <span className={`
                            text-[11px] font-medium
                            ${cellBgColor ? 'text-white drop-shadow-sm' : 'text-gray-700'}
                          `}>
                            {dayData.day}
                          </span>
                          {/* Multiple activities indicator */}
                          {dayActivities.length > 1 && (
                            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-px pb-px">
                              {dayActivities.slice(0, 3).map((a, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full border border-white/50"
                                  style={{ backgroundColor: typeColors[a.training_type_id] }}
                                />
                              ))}
                              {dayActivities.length > 3 && (
                                <span className="text-[8px] text-white">+</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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

