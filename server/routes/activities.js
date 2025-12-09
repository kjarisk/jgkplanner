import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, canEdit, adminOnly } from '../middleware/auth.js'
import { validate, createActivitySchema, updateActivitySchema, createRecurringSchema } from '../utils/validation.js'

const router = express.Router()

// Helper to normalize trainer_id/trainer_ids - always returns an array
function normalizeTrainerIds(trainer_id, trainer_ids, defaultTrainerId = null) {
  // If trainer_ids array is provided, use it
  if (trainer_ids && Array.isArray(trainer_ids) && trainer_ids.length > 0) {
    return trainer_ids.filter(id => id) // Filter out null/empty values
  }
  // If single trainer_id is provided, wrap in array
  if (trainer_id) {
    return [trainer_id]
  }
  // Fall back to default
  if (defaultTrainerId) {
    return [defaultTrainerId]
  }
  return []
}

// Helper to get trainer details for an activity
function getTrainersForActivity(activity, trainers) {
  const trainerIds = activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : [])
  return trainerIds
    .map(id => trainers.find(t => t.id === id))
    .filter(t => t)
    .map(t => ({ id: t.id, name: t.name, hourly_cost: t.hourly_cost }))
}

// Helper to generate dates for recurring series
function generateRecurringDates(weekdays, startDate, endDate) {
  const dates = []
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date(start.getFullYear(), 11, 31)
  
  const weekdayMap = weekdays.map(d => parseInt(d)) // 0=Sunday, 1=Monday, etc.
  
  const current = new Date(start)
  while (current <= end) {
    if (weekdayMap.includes(current.getDay())) {
      dates.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Get activities for a specific year
router.get('/year/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    await db.read()

    const activities = db.data.activities
      .filter(a => a.date >= startDate && a.date <= endDate && !a.is_deleted)
      .map(a => {
        const type = db.data.training_types.find(t => t.id === a.training_type_id)
        const trainers = getTrainersForActivity(a, db.data.trainers)
        // Backwards compatibility: keep trainer_id as first trainer
        const primaryTrainerId = a.trainer_ids?.[0] || a.trainer_id || null
        const primaryTrainer = primaryTrainerId ? db.data.trainers.find(t => t.id === primaryTrainerId) : null
        return {
          ...a,
          trainer_ids: a.trainer_ids || (a.trainer_id ? [a.trainer_id] : []),
          trainers,
          type_name: type?.name || 'Unknown',
          type_color: type?.color || '#gray',
          default_hours: type?.default_hours,
          default_trainer_id: type?.default_trainer_id,
          trainer_name: primaryTrainer?.name || null,
          trainer_names: trainers.map(t => t.name).join(', ') || null
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    res.json(activities)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get activities for a specific date
router.get('/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params

    await db.read()

    const activities = db.data.activities
      .filter(a => a.date === date && !a.is_deleted)
      .map(a => {
        const type = db.data.training_types.find(t => t.id === a.training_type_id)
        const trainers = getTrainersForActivity(a, db.data.trainers)
        const primaryTrainerId = a.trainer_ids?.[0] || a.trainer_id || null
        const primaryTrainer = primaryTrainerId ? db.data.trainers.find(t => t.id === primaryTrainerId) : null
        return {
          ...a,
          trainer_ids: a.trainer_ids || (a.trainer_id ? [a.trainer_id] : []),
          trainers,
          type_name: type?.name || 'Unknown',
          type_color: type?.color || '#gray',
          default_hours: type?.default_hours,
          default_trainer_id: type?.default_trainer_id,
          trainer_name: primaryTrainer?.name || null,
          trainer_names: trainers.map(t => t.name).join(', ') || null
        }
      })

    res.json(activities)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create bulk activities (for copy/paste week)
router.post('/bulk', authenticateToken, canEdit, async (req, res) => {
  try {
    const { activities: newActivities } = req.body

    if (!newActivities || !Array.isArray(newActivities) || newActivities.length === 0) {
      return res.status(400).json({ error: 'Activities array is required' })
    }

    await db.read()

    const createdActivities = []

    for (const actData of newActivities) {
      const { date, training_type_id, trainer_id, trainer_ids, hours, start_time, notes } = actData

      if (!date || !training_type_id) continue

      const type = db.data.training_types.find(t => t.id === training_type_id)
      if (!type) continue

      const finalTrainerIds = normalizeTrainerIds(trainer_id, trainer_ids, type.default_trainer_id)
      const finalHours = hours || type.default_hours

      const activity = {
        id: generateId(),
        date,
        training_type_id,
        trainer_id: finalTrainerIds[0] || null, // Backwards compatibility
        trainer_ids: finalTrainerIds,
        hours: parseFloat(finalHours) || 0,
        start_time: start_time || null,
        series_id: null,
        is_deleted: false,
        notes: notes || null,
        created_at: getCurrentTimestamp()
      }

      db.data.activities.push(activity)
      createdActivities.push(activity)
    }

    await db.write()

    res.status(201).json({
      created: createdActivities.length,
      activities: createdActivities
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create single activity
router.post('/', authenticateToken, canEdit, validate(createActivitySchema), async (req, res) => {
  try {
    const { date, training_type_id, trainer_id, trainer_ids, hours, start_time, notes } = req.body

    await db.read()

    // Get training type defaults if not provided
    const type = db.data.training_types.find(t => t.id === training_type_id)
    if (!type) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    const finalTrainerIds = normalizeTrainerIds(trainer_id, trainer_ids, type.default_trainer_id)
    const finalHours = hours || type.default_hours

    const activity = {
      id: generateId(),
      date,
      training_type_id,
      trainer_id: finalTrainerIds[0] || null, // Backwards compatibility
      trainer_ids: finalTrainerIds,
      hours: parseFloat(finalHours),
      start_time: start_time || null,
      series_id: null,
      is_deleted: false,
      notes: notes || null,
      created_at: getCurrentTimestamp()
    }

    db.data.activities.push(activity)
    await db.write()

    const trainers = getTrainersForActivity(activity, db.data.trainers)
    const primaryTrainer = finalTrainerIds[0] ? db.data.trainers.find(t => t.id === finalTrainerIds[0]) : null

    res.status(201).json({
      ...activity,
      trainers,
      type_name: type.name,
      type_color: type.color,
      trainer_name: primaryTrainer?.name || null,
      trainer_names: trainers.map(t => t.name).join(', ') || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create recurring series
router.post('/recurring', authenticateToken, canEdit, validate(createRecurringSchema), async (req, res) => {
  try {
    const { training_type_id, trainer_id, trainer_ids, hours, start_time, weekdays, start_date, end_date } = req.body

    await db.read()

    // Get training type defaults
    const type = db.data.training_types.find(t => t.id === training_type_id)
    if (!type) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    const finalTrainerIds = normalizeTrainerIds(trainer_id, trainer_ids, type.default_trainer_id)
    const finalHours = hours || type.default_hours

    // Create the series
    const series = {
      id: generateId(),
      training_type_id,
      trainer_id: finalTrainerIds[0] || null, // Backwards compatibility
      trainer_ids: finalTrainerIds,
      hours: parseFloat(finalHours),
      start_time: start_time || null,
      weekdays: JSON.stringify(weekdays),
      start_date,
      end_date: end_date || null,
      created_at: getCurrentTimestamp()
    }

    db.data.recurring_series.push(series)

    // Generate individual activities for the series
    const dates = generateRecurringDates(weekdays, start_date, end_date)
    
    for (const date of dates) {
      db.data.activities.push({
        id: generateId(),
        date,
        training_type_id,
        trainer_id: finalTrainerIds[0] || null, // Backwards compatibility
        trainer_ids: finalTrainerIds,
        hours: parseFloat(finalHours),
        start_time: start_time || null,
        series_id: series.id,
        is_deleted: false,
        notes: null,
        created_at: getCurrentTimestamp()
      })
    }

    await db.write()

    res.status(201).json({ 
      series_id: series.id,
      activities_created: dates.length,
      dates
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update single activity
router.put('/:id', authenticateToken, canEdit, async (req, res) => {
  try {
    const { id } = req.params
    const { trainer_id, trainer_ids, hours, start_time, notes } = req.body

    await db.read()

    const activityIndex = db.data.activities.findIndex(a => a.id === id)
    if (activityIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' })
    }

    // Handle trainer_ids update (new format takes priority)
    if (trainer_ids !== undefined) {
      db.data.activities[activityIndex].trainer_ids = trainer_ids
      db.data.activities[activityIndex].trainer_id = trainer_ids[0] || null // Backwards compatibility
    } else if (trainer_id !== undefined) {
      db.data.activities[activityIndex].trainer_id = trainer_id
      db.data.activities[activityIndex].trainer_ids = trainer_id ? [trainer_id] : []
    }
    
    if (hours !== undefined) db.data.activities[activityIndex].hours = parseFloat(hours)
    if (start_time !== undefined) db.data.activities[activityIndex].start_time = start_time
    if (notes !== undefined) db.data.activities[activityIndex].notes = notes

    await db.write()

    const activity = db.data.activities[activityIndex]
    const type = db.data.training_types.find(t => t.id === activity.training_type_id)
    const trainers = getTrainersForActivity(activity, db.data.trainers)
    const primaryTrainer = activity.trainer_ids?.[0] ? db.data.trainers.find(t => t.id === activity.trainer_ids[0]) : null

    res.json({
      ...activity,
      trainer_ids: activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : []),
      trainers,
      type_name: type?.name || 'Unknown',
      type_color: type?.color || '#gray',
      trainer_name: primaryTrainer?.name || null,
      trainer_names: trainers.map(t => t.name).join(', ') || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete single activity (or mark as exception from series)
router.delete('/:id', authenticateToken, canEdit, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()

    const activityIndex = db.data.activities.findIndex(a => a.id === id)
    if (activityIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' })
    }

    const activity = db.data.activities[activityIndex]

    if (activity.series_id) {
      // Part of a series - mark as deleted (exception) instead of actually deleting
      db.data.activities[activityIndex].is_deleted = true
      await db.write()
      res.json({ message: 'Activity removed from series' })
    } else {
      // Single activity - actually delete
      db.data.activities.splice(activityIndex, 1)
      await db.write()
      res.json({ message: 'Activity deleted successfully' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete entire recurring series
router.delete('/series/:seriesId', authenticateToken, canEdit, async (req, res) => {
  try {
    const { seriesId } = req.params
    
    await db.read()

    // Delete all activities in the series
    db.data.activities = db.data.activities.filter(a => a.series_id !== seriesId)
    
    // Delete the series itself
    const seriesIndex = db.data.recurring_series.findIndex(s => s.id === seriesId)
    if (seriesIndex === -1) {
      return res.status(404).json({ error: 'Series not found' })
    }

    db.data.recurring_series.splice(seriesIndex, 1)
    await db.write()

    res.json({ message: 'Recurring series deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Helper to calculate total cost for an activity (handles multiple trainers)
function calculateActivityCost(activity, trainers) {
  const trainerIds = activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : [])
  return trainerIds.reduce((sum, trainerId) => {
    const trainer = trainers.find(t => t.id === trainerId)
    return sum + (activity.hours || 0) * (trainer?.hourly_cost || 0)
  }, 0)
}

// Get roadmap data for a year - aggregated by week
router.get('/roadmap/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    await db.read()

    const yearActivities = db.data.activities.filter(
      a => a.date >= startDate && a.date <= endDate && !a.is_deleted
    )

    // Helper to get ISO week number
    function getWeekNumber(dateStr) {
      const d = new Date(dateStr)
      const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = utc.getUTCDay() || 7
      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
      return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7)
    }

    // Build week data for each activity
    const activityWeeks = yearActivities.map(a => ({
      ...a,
      week: getWeekNumber(a.date),
      month: new Date(a.date).getMonth()
    }))

    // Aggregate by training type
    const byTypeMap = {}
    activityWeeks.forEach(a => {
      const type = db.data.training_types.find(t => t.id === a.training_type_id)
      if (!type) return

      if (!byTypeMap[a.training_type_id]) {
        byTypeMap[a.training_type_id] = {
          id: a.training_type_id,
          name: type.name,
          color: type.color,
          weeks: new Set(),
          activities: []
        }
      }
      byTypeMap[a.training_type_id].weeks.add(a.week)
      byTypeMap[a.training_type_id].activities.push({
        id: a.id,
        date: a.date,
        week: a.week,
        hours: a.hours,
        start_time: a.start_time,
        notes: a.notes
      })
    })

    // Convert Sets to arrays and sort
    const byType = Object.values(byTypeMap).map(item => ({
      ...item,
      weeks: Array.from(item.weeks).sort((a, b) => a - b),
      activities: item.activities.sort((a, b) => a.date.localeCompare(b.date))
    })).sort((a, b) => a.name.localeCompare(b.name))

    // Aggregate by trainer
    const byTrainerMap = {}
    activityWeeks.forEach(a => {
      const trainerIds = a.trainer_ids || (a.trainer_id ? [a.trainer_id] : [])
      if (trainerIds.length === 0) return

      const type = db.data.training_types.find(t => t.id === a.training_type_id)

      trainerIds.forEach(trainerId => {
        const trainer = db.data.trainers.find(t => t.id === trainerId)
        if (!trainer) return

        if (!byTrainerMap[trainerId]) {
          byTrainerMap[trainerId] = {
            id: trainerId,
            name: trainer.name,
            weeks: new Set(),
            activities: []
          }
        }
        byTrainerMap[trainerId].weeks.add(a.week)
        byTrainerMap[trainerId].activities.push({
          id: a.id,
          date: a.date,
          week: a.week,
          hours: a.hours,
          start_time: a.start_time,
          type_name: type?.name || 'Unknown',
          type_color: type?.color || '#gray',
          notes: a.notes
        })
      })
    })

    // Convert Sets to arrays and sort
    const byTrainer = Object.values(byTrainerMap).map(item => ({
      ...item,
      weeks: Array.from(item.weeks).sort((a, b) => a - b),
      activities: item.activities.sort((a, b) => a.date.localeCompare(b.date))
    })).sort((a, b) => a.name.localeCompare(b.name))

    // Calculate week ranges for each period
    // Q1: Week 1-13 (Jan-Mar), Q2: Week 14-26 (Apr-Jun), 
    // Vacation: Week 27-31 (Jul), Q3: Week 32-39 (Aug-Sep), Q4: Week 40-52 (Oct-Dec)
    const periods = [
      { name: 'Vintertrening', startWeek: 1, endWeek: 13, months: 'Jan - Mar' },
      { name: 'Vår', startWeek: 14, endWeek: 26, months: 'Apr - Jun' },
      { name: 'Ferie', startWeek: 27, endWeek: 31, months: 'Jul', isVacation: true },
      { name: 'Høst', startWeek: 32, endWeek: 39, months: 'Aug - Sep' },
      { name: 'Sesongavslutning', startWeek: 40, endWeek: 52, months: 'Okt - Des' }
    ]

    res.json({
      year: parseInt(year),
      periods,
      byType,
      byTrainer,
      totalWeeks: 52
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get budget summary for a year (admin only)
router.get('/budget/:year', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { year } = req.params
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    await db.read()

    const yearActivities = db.data.activities.filter(
      a => a.date >= startDate && a.date <= endDate && !a.is_deleted
    )

    // Summary by training type
    const byTypeMap = {}
    yearActivities.forEach(a => {
      const type = db.data.training_types.find(t => t.id === a.training_type_id)
      const cost = calculateActivityCost(a, db.data.trainers)

      if (!byTypeMap[a.training_type_id]) {
        byTypeMap[a.training_type_id] = {
          id: a.training_type_id,
          name: type?.name || 'Unknown',
          color: type?.color || '#gray',
          session_count: 0,
          total_hours: 0,
          total_cost: 0
        }
      }
      byTypeMap[a.training_type_id].session_count++
      byTypeMap[a.training_type_id].total_hours += a.hours || 0
      byTypeMap[a.training_type_id].total_cost += cost
    })

    // Summary by trainer (each trainer gets counted for activities they're on)
    const byTrainerMap = {}
    yearActivities.forEach(a => {
      const trainerIds = a.trainer_ids || (a.trainer_id ? [a.trainer_id] : [])
      if (trainerIds.length === 0) return

      trainerIds.forEach(trainerId => {
        const trainer = db.data.trainers.find(t => t.id === trainerId)
        if (!trainer) return

        const cost = (a.hours || 0) * (trainer.hourly_cost || 0)

        if (!byTrainerMap[trainerId]) {
          byTrainerMap[trainerId] = {
            id: trainerId,
            name: trainer.name,
            hourly_cost: trainer.hourly_cost,
            session_count: 0,
            total_hours: 0,
            total_cost: 0
          }
        }
        byTrainerMap[trainerId].session_count++
        byTrainerMap[trainerId].total_hours += a.hours || 0
        byTrainerMap[trainerId].total_cost += cost
      })
    })

    // Grand totals
    let totalSessions = 0
    let totalHours = 0
    let totalCost = 0
    yearActivities.forEach(a => {
      totalSessions++
      totalHours += a.hours || 0
      totalCost += calculateActivityCost(a, db.data.trainers)
    })

    res.json({
      year: parseInt(year),
      byType: Object.values(byTypeMap).sort((a, b) => a.name.localeCompare(b.name)),
      byTrainer: Object.values(byTrainerMap).sort((a, b) => a.name.localeCompare(b.name)),
      totals: {
        total_sessions: totalSessions,
        total_hours: totalHours,
        total_cost: totalCost
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
