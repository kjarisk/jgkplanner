import { useState, useEffect } from 'react'
import { api } from '../api'

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export default function ActivityModal({ 
  date, 
  activity, 
  activities,
  trainingTypes, 
  trainers, 
  onClose, 
  onSaved 
}) {
  const [mode, setMode] = useState(activity ? 'edit' : (activities.length > 0 ? 'list' : 'add'))
  const [selectedActivity, setSelectedActivity] = useState(activity)
  const [isRecurring, setIsRecurring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    training_type_id: activity?.training_type_id || '',
    trainer_id: activity?.trainer_id || '',
    hours: activity?.hours || '',
    notes: activity?.notes || '',
    // Recurring options
    weekdays: [],
    end_date: ''
  })

  // When training type changes, set defaults
  useEffect(() => {
    if (formData.training_type_id && !activity) {
      const type = trainingTypes.find(t => t.id === parseInt(formData.training_type_id))
      if (type) {
        setFormData(prev => ({
          ...prev,
          trainer_id: prev.trainer_id || type.default_trainer_id || '',
          hours: prev.hours || type.default_hours || ''
        }))
      }
    }
  }, [formData.training_type_id, trainingTypes, activity])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (selectedActivity) {
        // Update existing
        await api.activities.update(selectedActivity.id, {
          trainer_id: formData.trainer_id || null,
          hours: parseFloat(formData.hours) || null,
          notes: formData.notes || null
        })
      } else if (isRecurring) {
        // Create recurring series
        await api.activities.createRecurring({
          training_type_id: parseInt(formData.training_type_id),
          trainer_id: formData.trainer_id ? parseInt(formData.trainer_id) : null,
          hours: parseFloat(formData.hours) || null,
          weekdays: formData.weekdays,
          start_date: date,
          end_date: formData.end_date || null
        })
      } else {
        // Create single activity
        await api.activities.create({
          date,
          training_type_id: parseInt(formData.training_type_id),
          trainer_id: formData.trainer_id ? parseInt(formData.trainer_id) : null,
          hours: parseFloat(formData.hours) || null,
          notes: formData.notes || null
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedActivity) return
    if (!confirm('Delete this activity?')) return

    setLoading(true)
    try {
      await api.activities.delete(selectedActivity.id)
      onSaved()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleDeleteSeries() {
    if (!selectedActivity?.series_id) return
    if (!confirm('Delete entire recurring series?')) return

    setLoading(true)
    try {
      await api.activities.deleteSeries(selectedActivity.series_id)
      onSaved()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function toggleWeekday(day) {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].slice(0, 2) // Max 2 days
    }))
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('no-NO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'list' ? 'Activities' : (selectedActivity ? 'Edit Activity' : 'Add Activity')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Display */}
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
          {formatDate(date)}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* List Mode - show existing activities */}
          {mode === 'list' && (
            <div className="space-y-3">
              {activities.map(a => (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedActivity(a)
                    setFormData({
                      training_type_id: a.training_type_id,
                      trainer_id: a.trainer_id || '',
                      hours: a.hours || '',
                      notes: a.notes || '',
                      weekdays: [],
                      end_date: ''
                    })
                    setMode('edit')
                  }}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: a.type_color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{a.type_name}</p>
                    <p className="text-sm text-gray-500">
                      {a.trainer_name || 'No trainer'} - {a.hours}h
                      {a.series_id && ' (recurring)'}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setSelectedActivity(null)
                  setFormData({
                    training_type_id: '',
                    trainer_id: '',
                    hours: '',
                    notes: '',
                    weekdays: [],
                    end_date: ''
                  })
                  setMode('add')
                }}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-400 hover:text-teal-600"
              >
                + Add another activity
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Training Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Training Type *
                </label>
                <select
                  value={formData.training_type_id}
                  onChange={(e) => setFormData({ ...formData, training_type_id: e.target.value })}
                  disabled={!!selectedActivity}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select type...</option>
                  {trainingTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Trainer Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trainer (override)
                </label>
                <select
                  value={formData.trainer_id}
                  onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Use default</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                  ))}
                </select>
              </div>

              {/* Hours Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours (override)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Use default"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Recurring Options (only for new activities) */}
              {!selectedActivity && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Make recurring</span>
                  </label>

                  {isRecurring && (
                    <div className="mt-4 space-y-4 pl-6">
                      {/* Weekday Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat on (select 1-2 days)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleWeekday(day.value)}
                              className={`px-3 py-1 rounded text-sm ${
                                formData.weekdays.includes(day.value)
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {day.label.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End date (optional)
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          min={date}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to repeat until end of year
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedActivity && (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                    >
                      Delete
                    </button>
                    {selectedActivity.series_id && (
                      <button
                        type="button"
                        onClick={handleDeleteSeries}
                        disabled={loading}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        Delete Series
                      </button>
                    )}
                  </>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => activities.length > 0 && !activity ? setMode('list') : onClose()}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (isRecurring && formData.weekdays.length === 0)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Saving...' : (selectedActivity ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

