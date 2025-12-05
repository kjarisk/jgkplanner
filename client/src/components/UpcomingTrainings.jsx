import { useState, useMemo } from 'react'

export default function UpcomingTrainings({ activities, trainingTypes, trainers, year }) {
  const [filters, setFilters] = useState({
    trainer: '',
    type: '',
    timeFilter: '' // 'before17', 'after17', or ''
  })

  // Get current date info
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    // Only show activities from current month onwards (or selected year)
    const startDate = year === currentYear 
      ? today.toISOString().split('T')[0]
      : `${year}-01-01`
    
    return activities
      .filter(activity => {
        // Date filter - from today or start of selected year
        if (activity.date < startDate) return false
        
        // Trainer filter
        if (filters.trainer && activity.trainer_id !== filters.trainer) return false
        
        // Type filter
        if (filters.type && activity.training_type_id !== filters.type) return false
        
        // Time filter
        if (filters.timeFilter && activity.start_time) {
          const hour = parseInt(activity.start_time.split(':')[0])
          if (filters.timeFilter === 'before17' && hour >= 17) return false
          if (filters.timeFilter === 'after17' && hour < 17) return false
        } else if (filters.timeFilter && !activity.start_time) {
          // If no time set, don't filter it out
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by date, then by start_time
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
        return 0
      })
      .slice(0, 20) // Limit to 20 items
  }, [activities, filters, year, currentYear])

  // Create type colors map
  const typeColors = useMemo(() => {
    const colors = {}
    trainingTypes.forEach(type => {
      colors[type.id] = type.color
    })
    return colors
  }, [trainingTypes])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('no-NO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const clearFilters = () => {
    setFilters({ trainer: '', type: '', timeFilter: '' })
  }

  const hasFilters = filters.trainer || filters.type || filters.timeFilter

  return (
    <div className="bg-white rounded-lg shadow mt-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Trainings</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              Clear filters
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Type filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All types</option>
            {trainingTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          {/* Trainer filter */}
          <select
            value={filters.trainer}
            onChange={(e) => setFilters({ ...filters, trainer: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All trainers</option>
            {trainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
            ))}
          </select>

          {/* Time filter */}
          <select
            value={filters.timeFilter}
            onChange={(e) => setFilters({ ...filters, timeFilter: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All times</option>
            <option value="before17">Before 17:00</option>
            <option value="after17">After 17:00</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No upcoming trainings {hasFilters && 'matching filters'}
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded flex-shrink-0"
                style={{ backgroundColor: typeColors[activity.training_type_id] }}
              />
              
              {/* Date */}
              <div className="w-24 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(activity.date)}
                </span>
              </div>
              
              {/* Time */}
              <div className="w-14 flex-shrink-0">
                {activity.start_time ? (
                  <span className="text-sm text-gray-600">{activity.start_time}</span>
                ) : (
                  <span className="text-sm text-gray-400">--:--</span>
                )}
              </div>
              
              {/* Type name */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate block">
                  {activity.type_name}
                </span>
              </div>
              
              {/* Trainer */}
              <div className="text-sm text-gray-500 flex-shrink-0">
                {activity.trainer_name || '-'}
              </div>
              
              {/* Hours */}
              <div className="text-sm text-gray-500 flex-shrink-0 w-12 text-right">
                {activity.hours}h
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Showing {filteredActivities.length} upcoming training(s)
        </div>
      )}
    </div>
  )
}

