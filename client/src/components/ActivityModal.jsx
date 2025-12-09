import { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../api'
import { formatDate, toDateString } from '../utils/date'

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

// Generate recurring dates for preview
function generatePreviewDates(weekdays, startDate, endDate) {
  if (!weekdays || weekdays.length === 0 || !startDate) return []
  
  const dates = []
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date(start.getFullYear(), 11, 31)
  
  const current = new Date(start)
  while (current <= end) {
    if (weekdays.includes(current.getDay())) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      dates.push(dateStr)
    }
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

export default function ActivityModal({ 
  date, 
  activity, 
  activities = [],
  initialMode = 'add',
  trainingTypes, 
  trainers, 
  onClose, 
  onSaved,
  onPreviewDates
}) {
  const [mode, setMode] = useState(initialMode)
  const [selectedActivity, setSelectedActivity] = useState(activity)
  const [isRecurring, setIsRecurring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(date)
  
  const [formData, setFormData] = useState({
    training_type_id: activity?.training_type_id || '',
    trainer_ids: activity?.trainer_ids || (activity?.trainer_id ? [activity.trainer_id] : []),
    hours: activity?.hours || '',
    start_time: activity?.start_time || '',
    notes: activity?.notes || '',
    // Recurring options
    weekdays: [],
    end_date: ''
  })

  // Track which training type we've already applied defaults for (prevents loops)
  const appliedDefaultsForType = useRef(null)
  // Track which activity we've already initialized form from (prevents loops)
  const initializedForActivityId = useRef(null)

  // Update form when activity changes
  useEffect(() => {
    if (activity) {
      // Skip if we've already initialized for this activity
      if (initializedForActivityId.current === activity.id) return
      initializedForActivityId.current = activity.id
      
      setFormData({
        training_type_id: activity.training_type_id || '',
        trainer_ids: activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : []),
        hours: activity.hours || '',
        start_time: activity.start_time || '',
        notes: activity.notes || '',
        weekdays: [],
        end_date: ''
      })
      setCurrentDate(activity.date || date)
      setSelectedActivity(activity)
    }
  }, [activity, date])

  // When training type changes, set defaults (only for NEW activities)
  useEffect(() => {
    // Skip if editing existing activity or if we've already applied defaults for this type
    if (activity || !formData.training_type_id) return
    if (appliedDefaultsForType.current === formData.training_type_id) return
    
    const type = trainingTypes.find(t => t.id === formData.training_type_id)
    if (type) {
      appliedDefaultsForType.current = formData.training_type_id
      setFormData(prev => ({
        ...prev,
        trainer_ids: prev.trainer_ids?.length > 0 ? prev.trainer_ids : (type.default_trainer_id ? [type.default_trainer_id] : []),
        hours: prev.hours || type.default_hours || ''
      }))
    }
  }, [formData.training_type_id, trainingTypes, activity])

  // Generate preview dates when recurring options change (only relevant in recurring mode)
  useEffect(() => {
    if (!onPreviewDates || !isRecurring) return
    
    if (formData.weekdays.length > 0 && currentDate) {
      const previewDates = generatePreviewDates(
        formData.weekdays, 
        currentDate, 
        formData.end_date || null
      )
      onPreviewDates(previewDates, formData.training_type_id)
    } else {
      onPreviewDates([], null)
    }
  }, [isRecurring, formData.weekdays, currentDate, formData.end_date, formData.training_type_id, onPreviewDates])
  
  // Clear preview dates when modal closes or exits recurring mode
  useEffect(() => {
    return () => {
      if (onPreviewDates) {
        onPreviewDates([], null)
      }
    }
  }, [onPreviewDates])

  // Preview dates count for display
  const previewDatesCount = useMemo(() => {
    if (!isRecurring || formData.weekdays.length === 0 || !currentDate) return 0
    return generatePreviewDates(formData.weekdays, currentDate, formData.end_date || null).length
  }, [isRecurring, formData.weekdays, currentDate, formData.end_date])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let actionData = null
      
      if (selectedActivity) {
        // Update existing
        const previousData = {
          trainer_ids: selectedActivity.trainer_ids || (selectedActivity.trainer_id ? [selectedActivity.trainer_id] : []),
          hours: selectedActivity.hours,
          start_time: selectedActivity.start_time,
          notes: selectedActivity.notes
        }
        
        const updateData = {
          trainer_ids: formData.trainer_ids?.length > 0 ? formData.trainer_ids : [],
          hours: parseFloat(formData.hours) || null,
          start_time: formData.start_time || null,
          notes: formData.notes || null
        }
        
        if (currentDate !== selectedActivity.date) {
          // Date changed - delete old and create new
          await api.activities.delete(selectedActivity.id)
          const newActivity = await api.activities.create({
            date: currentDate,
            training_type_id: selectedActivity.training_type_id,
            trainer_ids: formData.trainer_ids?.length > 0 ? formData.trainer_ids : [],
            hours: parseFloat(formData.hours) || null,
            start_time: formData.start_time || null,
            notes: formData.notes || null
          })
          
          actionData = {
            type: 'reschedule_activity',
            activityId: newActivity.id,
            originalDate: selectedActivity.date,
            activityData: {
              training_type_id: selectedActivity.training_type_id,
              trainer_ids: formData.trainer_ids?.length > 0 ? formData.trainer_ids : [],
              hours: parseFloat(formData.hours) || null,
              start_time: formData.start_time || null,
              notes: formData.notes || null
            },
            message: 'Activity rescheduled'
          }
        } else {
          await api.activities.update(selectedActivity.id, updateData)
          
          actionData = {
            type: 'update_activity',
            activityId: selectedActivity.id,
            previousData,
            message: 'Activity updated'
          }
        }
      } else if (isRecurring) {
        // Create recurring series
        const result = await api.activities.createRecurring({
          training_type_id: formData.training_type_id,
          trainer_ids: formData.trainer_ids?.length > 0 ? formData.trainer_ids : [],
          hours: parseFloat(formData.hours) || null,
          start_time: formData.start_time || null,
          weekdays: formData.weekdays,
          start_date: currentDate,
          end_date: formData.end_date || null
        })
        
        actionData = {
          type: 'create_recurring',
          seriesId: result.series_id,
          message: `Created ${result.activities_created} recurring activities`
        }
      } else {
        // Create single activity
        const newActivity = await api.activities.create({
          date: currentDate,
          training_type_id: formData.training_type_id,
          trainer_ids: formData.trainer_ids?.length > 0 ? formData.trainer_ids : [],
          hours: parseFloat(formData.hours) || null,
          start_time: formData.start_time || null,
          notes: formData.notes || null
        })
        
        actionData = {
          type: 'create_activity',
          activityId: newActivity.id,
          message: 'Activity created'
        }
      }
      
      onSaved(actionData)
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
      // Store activity data for undo
      const activityData = {
        date: selectedActivity.date,
        training_type_id: selectedActivity.training_type_id,
        trainer_ids: selectedActivity.trainer_ids || (selectedActivity.trainer_id ? [selectedActivity.trainer_id] : []),
        hours: selectedActivity.hours,
        start_time: selectedActivity.start_time,
        notes: selectedActivity.notes
      }
      
      await api.activities.delete(selectedActivity.id)
      
      onSaved({
        type: 'delete_activity',
        activityData,
        message: 'Activity deleted'
      })
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
      onSaved({
        type: 'delete_series',
        message: 'Recurring series deleted'
      })
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
        : [...prev.weekdays, day].slice(0, 2)
    }))
  }

  function switchToAddMode() {
    // Reset the ref so add mode doesn't think we're still editing
    initializedForActivityId.current = null
    appliedDefaultsForType.current = null
    setSelectedActivity(null)
    setFormData({
      training_type_id: '',
      trainer_ids: [],
      hours: '',
      start_time: '',
      notes: '',
      weekdays: [],
      end_date: ''
    })
    setIsRecurring(false)
    setMode('add')
    if (onPreviewDates) onPreviewDates([], null)
  }

  function selectActivityToEdit(act) {
    // Update the ref so the useEffect doesn't re-initialize
    initializedForActivityId.current = act.id
    setSelectedActivity(act)
    setFormData({
      training_type_id: act.training_type_id,
      trainer_ids: act.trainer_ids || (act.trainer_id ? [act.trainer_id] : []),
      hours: act.hours || '',
      start_time: act.start_time || '',
      notes: act.notes || '',
      weekdays: [],
      end_date: ''
    })
    setCurrentDate(act.date)
    setMode('edit')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'list' ? 'Activities' : (mode === 'edit' ? 'Edit Activity' : 'Add Activity')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* List Mode */}
          {mode === 'list' && (
            <div className="space-y-3">
              <div className="pb-3 text-sm text-gray-600 border-b border-gray-200">
                {formatDate(date)}
              </div>
              
              {activities.map(a => (
                <div
                  key={a.id}
                  onClick={() => selectActivityToEdit(a)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: a.type_color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{a.type_name}</p>
                    <p className="text-sm text-gray-500">
                      {a.start_time && <span className="font-medium">{a.start_time}</span>}
                      {a.start_time && ' - '}
                      {a.trainer_name || 'No trainer'} - {a.hours}h
                      {a.series_id && ' (recurring)'}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={switchToAddMode}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-400 hover:text-teal-600"
              >
                + Add another activity
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {(mode === 'add' || mode === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date {selectedActivity && <span className="text-gray-400">(can be changed)</span>}
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                >
                  <option value="">Select type...</option>
                  {trainingTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Trainers (Multiple Selection) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trainers {!selectedActivity && '(override)'}
                </label>
                {/* Selected trainers as chips */}
                {formData.trainer_ids?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.trainer_ids.map(trainerId => {
                      const trainer = trainers.find(t => t.id === trainerId)
                      if (!trainer) return null
                      return (
                        <span
                          key={trainerId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                        >
                          {trainer.name}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              trainer_ids: formData.trainer_ids.filter(id => id !== trainerId)
                            })}
                            className="hover:text-teal-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {/* Add trainer dropdown */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.trainer_ids?.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        trainer_ids: [...(formData.trainer_ids || []), e.target.value]
                      })
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">
                    {formData.trainer_ids?.length > 0 ? '+ Add another trainer' : 'Select trainer(s)'}
                  </option>
                  {trainers
                    .filter(t => !formData.trainer_ids?.includes(t.id))
                    .map(trainer => (
                      <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                    ))
                  }
                </select>
                {formData.trainer_ids?.length === 0 && !selectedActivity && (
                  <p className="text-xs text-gray-500 mt-1">Will use default trainer if none selected</p>
                )}
              </div>

              {/* Hours and Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours {!selectedActivity && '(override)'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
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

              {/* Recurring Options */}
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
                          min={currentDate}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to repeat until end of year
                        </p>
                      </div>

                      {/* Preview count */}
                      {previewDatesCount > 0 && (
                        <div className="p-3 bg-teal-50 rounded-lg">
                          <p className="text-sm text-teal-700">
                            <span className="font-semibold">{previewDatesCount}</span> activities will be created
                          </p>
                          <p className="text-xs text-teal-600 mt-1">
                            Preview shown on calendar
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
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
                {activities.length > 0 && mode !== 'list' && (
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    Back to List
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
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
