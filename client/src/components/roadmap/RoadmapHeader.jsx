/**
 * RoadmapHeader - Displays the timeline header with periods and week numbers
 */

import { MONTHS_SHORT } from '../../utils/date'

export default function RoadmapHeader({ periods, totalWeeks }) {
  // Calculate width percentage for each week
  const weekWidth = 100 / totalWeeks
  
  // Generate week numbers array
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  
  // Group weeks by month for month labels
  const getMonthForWeek = (weekNum) => {
    // Approximate: each month has ~4.3 weeks
    // Week 1-4: Jan, 5-8: Feb, 9-13: Mar, etc.
    const monthStarts = [1, 5, 9, 14, 18, 22, 27, 31, 36, 40, 44, 49]
    for (let i = monthStarts.length - 1; i >= 0; i--) {
      if (weekNum >= monthStarts[i]) return i
    }
    return 0
  }
  
  // Get unique months with their week ranges
  const monthRanges = []
  let currentMonth = -1
  weeks.forEach((week, idx) => {
    const month = getMonthForWeek(week)
    if (month !== currentMonth) {
      if (currentMonth !== -1) {
        monthRanges[monthRanges.length - 1].endWeek = week - 1
      }
      monthRanges.push({ month, startWeek: week, endWeek: week })
      currentMonth = month
    } else {
      monthRanges[monthRanges.length - 1].endWeek = week
    }
  })

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      {/* Period row */}
      <div className="flex">
        {/* Label column */}
        <div className="w-48 min-w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Perioder
          </span>
        </div>
        
        {/* Timeline */}
        <div className="flex-1 flex min-w-0">
          {periods.map((period, idx) => {
            const periodWeeks = period.endWeek - period.startWeek + 1
            const width = (periodWeeks / totalWeeks) * 100
            
            return (
              <div 
                key={idx}
                className={`
                  flex items-center justify-center py-2 px-2 border-r border-gray-200 last:border-r-0
                  ${period.isVacation ? 'bg-amber-50' : 'bg-gray-50'}
                `}
                style={{ width: `${width}%` }}
              >
                <div className="text-center">
                  <div className={`text-xs font-semibold ${period.isVacation ? 'text-amber-700' : 'text-gray-700'}`}>
                    {period.name}
                  </div>
                  <div className={`text-xs ${period.isVacation ? 'text-amber-600' : 'text-gray-500'}`}>
                    {period.months}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Month row */}
      <div className="flex border-b border-gray-100">
        {/* Label column */}
        <div className="w-48 min-w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Måned
          </span>
        </div>
        
        {/* Months */}
        <div className="flex-1 flex min-w-0">
          {monthRanges.map((range, idx) => {
            const monthWeeks = range.endWeek - range.startWeek + 1
            const width = (monthWeeks / totalWeeks) * 100
            
            // Check if this month is in vacation period
            const isVacation = periods.some(p => 
              p.isVacation && range.startWeek >= p.startWeek && range.endWeek <= p.endWeek
            )
            
            return (
              <div 
                key={idx}
                className={`
                  flex items-center justify-center py-1 border-r border-gray-100 last:border-r-0
                  ${isVacation ? 'bg-amber-50/50' : ''}
                `}
                style={{ width: `${width}%` }}
              >
                <span className={`text-xs font-medium ${isVacation ? 'text-amber-700' : 'text-gray-600'}`}>
                  {MONTHS_SHORT[range.month]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Week numbers row */}
      <div className="flex">
        {/* Label column */}
        <div className="w-48 min-w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Uke
          </span>
        </div>
        
        {/* Week numbers */}
        <div className="flex-1 flex min-w-0">
          {weeks.map((week) => {
            // Check if week is in vacation period
            const isVacation = periods.some(p => 
              p.isVacation && week >= p.startWeek && week <= p.endWeek
            )
            
            return (
              <div 
                key={week}
                className={`
                  flex items-center justify-center py-1 border-r border-gray-50 last:border-r-0
                  ${isVacation ? 'bg-amber-50/30' : ''}
                `}
                style={{ width: `${weekWidth}%` }}
              >
                <span className={`text-[10px] ${isVacation ? 'text-amber-600' : 'text-gray-400'}`}>
                  {week}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
