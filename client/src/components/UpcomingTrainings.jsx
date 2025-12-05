import { useState, useMemo } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { formatDateCompact, getTodayString } from '../utils/date'

export default function UpcomingTrainings({ activities, trainingTypes, trainers, year, onActivityUpdated }) {
  const { canEdit } = useAuth()
  const [filters, setFilters] = useState({
    trainer: '',
    type: '',
    timeFilter: '' // 'before17', 'after17', or ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)

  // Get current date info
  const today = new Date()
  const currentYear = today.getFullYear()

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    const startDate = year === currentYear 
      ? getTodayString()
      : `${year}-01-01`
    
    return activities
      .filter(activity => {
        if (activity.date < startDate) return false
        if (filters.trainer && activity.trainer_id !== filters.trainer) return false
        if (filters.type && activity.training_type_id !== filters.type) return false
        if (filters.timeFilter && activity.start_time) {
          const hour = parseInt(activity.start_time.split(':')[0])
          if (filters.timeFilter === 'before17' && hour >= 17) return false
          if (filters.timeFilter === 'after17' && hour < 17) return false
        }
        return true
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
        return 0
      })
      .slice(0, 30)
  }, [activities, filters, year, currentYear])

  // Create type colors map
  const typeColors = useMemo(() => {
    const colors = {}
    trainingTypes.forEach(type => {
      colors[type.id] = type.color
    })
    return colors
  }, [trainingTypes])

  const clearFilters = () => {
    setFilters({ trainer: '', type: '', timeFilter: '' })
  }

  const startEditing = (activity) => {
    setEditingId(activity.id)
    setEditData({
      date: activity.date,
      training_type_id: activity.training_type_id,
      trainer_id: activity.trainer_id || '',
      hours: activity.hours || '',
      start_time: activity.start_time || ''
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEdit = async (activityId) => {
    setSaving(true)
    try {
      // Check if date changed
      const original = activities.find(a => a.id === activityId)
      
      if (editData.date !== original.date) {
        // Date changed - delete and recreate
        await api.activities.delete(activityId)
        await api.activities.create({
          date: editData.date,
          training_type_id: editData.training_type_id,
          trainer_id: editData.trainer_id || null,
          hours: parseFloat(editData.hours) || null,
          start_time: editData.start_time || null
        })
      } else {
        // Just update
        await api.activities.update(activityId, {
          trainer_id: editData.trainer_id || null,
          hours: parseFloat(editData.hours) || null,
          start_time: editData.start_time || null
        })
      }
      
      setEditingId(null)
      setEditData({})
      if (onActivityUpdated) onActivityUpdated()
    } catch (error) {
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
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
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No upcoming trainings {hasFilters && 'matching filters'}
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="px-4 py-2 hover:bg-gray-50">
              {editingId === activity.id ? (
                /* Edit Mode */
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Color */}
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: typeColors[editData.training_type_id] }}
                  />
                  
                  {/* Date */}
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                  />
                  
                  {/* Time */}
                  <input
                    type="time"
                    value={editData.start_time}
                    onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-24"
                  />
                  
                  {/* Type */}
                  <select
                    value={editData.training_type_id}
                    onChange={(e) => setEditData({ ...editData, training_type_id: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1 flex-1 min-w-[120px]"
                  >
                    {trainingTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  
                  {/* Trainer */}
                  <select
                    value={editData.trainer_id}
                    onChange={(e) => setEditData({ ...editData, trainer_id: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                  >
                    <option value="">No trainer</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                    ))}
                  </select>
                  
                  {/* Hours */}
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={editData.hours}
                    onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
                    placeholder="hrs"
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-16"
                  />
                  
                  {/* Actions */}
                  <button
                    onClick={() => saveEdit(activity.id)}
                    disabled={saving}
                    className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* View Mode */
                <div 
                  className={`flex items-center gap-3 ${canEdit ? 'cursor-pointer' : ''}`}
                  onClick={() => canEdit && startEditing(activity)}
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: typeColors[activity.training_type_id] }}
                  />
                  
                  {/* Date */}
                  <div className="w-24 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateCompact(activity.date)}
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
                    {activity.hours ? `${activity.hours}h` : '-'}
                  </div>
                  
                  {/* Edit indicator */}
                  {canEdit && (
                    <div className="text-gray-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span>Showing {filteredActivities.length} upcoming training(s)</span>
          {canEdit && <span className="text-teal-600">Click row to edit</span>}
        </div>
      )}
    </div>
  )
}
