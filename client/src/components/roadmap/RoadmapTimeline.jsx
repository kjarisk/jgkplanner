/**
 * RoadmapTimeline - Displays activity rows with week blocks
 */

import TimelineRow from './TimelineRow'

export default function RoadmapTimeline({ 
  data, 
  periods, 
  totalWeeks, 
  viewMode,
  onActivityClick 
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Ingen aktiviteter funnet for dette året</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {data.map((item) => (
        <TimelineRow
          key={item.id}
          item={item}
          periods={periods}
          totalWeeks={totalWeeks}
          viewMode={viewMode}
          onActivityClick={onActivityClick}
        />
      ))}
    </div>
  )
}
