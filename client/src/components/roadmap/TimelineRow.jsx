/**
 * TimelineRow - Individual row showing activity blocks for weeks
 * Shows gaps when there are no activities for certain weeks
 */

import { useState } from 'react'

export default function TimelineRow({ 
  item, 
  periods, 
  totalWeeks, 
  viewMode,
  onActivityClick 
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null)
  
  // Calculate width percentage for each week
  const weekWidth = 100 / totalWeeks
  
  // Create a map of week -> activities for quick lookup
  const weekActivities = {}
  item.activities.forEach(activity => {
    if (!weekActivities[activity.week]) {
      weekActivities[activity.week] = []
    }
    weekActivities[activity.week].push(activity)
  })
  
  // Get color based on view mode
  const getColor = () => {
    if (viewMode === 'type') {
      return item.color || '#6b7280'
    }
    // For trainers, use a consistent teal color
    return '#14b8a6'
  }
  
  const color = getColor()
  
  // Generate all week slots
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  
  // Find segments - each continuous block of weeks with activities
  // A gap of 1+ weeks without activity creates a new segment
  const segments = []
  let currentSegment = null
  
  weeks.forEach((week) => {
    const hasActivity = weekActivities[week] && weekActivities[week].length > 0
    const isVacation = periods.some(p => p.isVacation && week >= p.startWeek && week <= p.endWeek)
    
    if (hasActivity && !isVacation) {
      if (currentSegment) {
        // Check if this is adjacent to the previous week in segment
        if (week === currentSegment.endWeek + 1) {
          // Extend current segment
          currentSegment.endWeek = week
          currentSegment.activities = [...currentSegment.activities, ...weekActivities[week]]
        } else {
          // Gap detected - save current and start new
          segments.push(currentSegment)
          currentSegment = {
            id: segments.length,
            startWeek: week,
            endWeek: week,
            activities: [...weekActivities[week]]
          }
        }
      } else {
        // Start new segment
        currentSegment = {
          id: segments.length,
          startWeek: week,
          endWeek: week,
          activities: [...weekActivities[week]]
        }
      }
    } else if (currentSegment) {
      // End of activities or vacation - save segment
      segments.push(currentSegment)
      currentSegment = null
    }
  })
  
  // Don't forget the last segment
  if (currentSegment) {
    segments.push(currentSegment)
  }

  return (
    <div className="flex hover:bg-gray-50/50 transition-colors">
      {/* Label column */}
      <div className="w-48 min-w-48 flex-shrink-0 border-r border-gray-200 px-4 py-3 flex items-center gap-2">
        {viewMode === 'type' && (
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-sm font-medium text-gray-800 truncate">
          {item.name}
        </span>
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
          ({item.activities.length})
        </span>
      </div>
      
      {/* Timeline */}
      <div className="flex-1 relative py-2 min-w-0">
        {/* Background grid */}
        <div className="absolute inset-0 flex">
          {weeks.map((week) => {
            const isVacation = periods.some(p => 
              p.isVacation && week >= p.startWeek && week <= p.endWeek
            )
            
            return (
              <div 
                key={week}
                className={`
                  border-r border-gray-50 last:border-r-0
                  ${isVacation ? 'bg-amber-50/30' : ''}
                `}
                style={{ width: `${weekWidth}%` }}
              />
            )
          })}
        </div>
        
        {/* Activity bars */}
        <div className="relative h-8 mx-1">
          {segments.map((segment) => {
            const leftPercent = ((segment.startWeek - 1) / totalWeeks) * 100
            const widthPercent = ((segment.endWeek - segment.startWeek + 1) / totalWeeks) * 100
            
            return (
              <div
                key={segment.id}
                className="absolute top-1 h-6 rounded-sm cursor-pointer transition-all hover:shadow-md hover:brightness-110"
                style={{
                  left: `${leftPercent}%`,
                  width: `calc(${widthPercent}% - 2px)`,
                  backgroundColor: color,
                }}
                onClick={() => onActivityClick(segment.activities[0], item)}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {/* Show activity count if bar is wide enough */}
                {widthPercent > 4 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium">
                    {segment.activities.length}
                  </span>
                )}
                
                {/* Tooltip on hover */}
                {hoveredSegment === segment.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-gray-300">
                        Uke {segment.startWeek}
                        {segment.startWeek !== segment.endWeek && ` - ${segment.endWeek}`}
                      </div>
                      <div className="text-gray-300">
                        {segment.activities.length} aktivitet{segment.activities.length > 1 ? 'er' : ''}
                      </div>
                      <div className="text-teal-400 text-[10px] mt-1">
                        Klikk for detaljer
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
