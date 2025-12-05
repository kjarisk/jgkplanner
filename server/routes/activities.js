import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, canEdit, adminOnly } from '../middleware/auth.js'
import { validate, createActivitySchema, updateActivitySchema, createRecurringSchema } from '../utils/validation.js'

const router = express.Router()

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
        const trainer = a.trainer_id ? db.data.trainers.find(t => t.id === a.trainer_id) : null
        return {
          ...a,
          type_name: type?.name || 'Unknown',
          type_color: type?.color || '#gray',
          default_hours: type?.default_hours,
          default_trainer_id: type?.default_trainer_id,
          trainer_name: trainer?.name || null
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
        const trainer = a.trainer_id ? db.data.trainers.find(t => t.id === a.trainer_id) : null
        return {
          ...a,
          type_name: type?.name || 'Unknown',
          type_color: type?.color || '#gray',
          default_hours: type?.default_hours,
          default_trainer_id: type?.default_trainer_id,
          trainer_name: trainer?.name || null
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
      const { date, training_type_id, trainer_id, hours, start_time, notes } = actData

      if (!date || !training_type_id) continue

      const type = db.data.training_types.find(t => t.id === training_type_id)
      if (!type) continue

      const finalTrainerId = trainer_id || type.default_trainer_id
      const finalHours = hours || type.default_hours

      const activity = {
        id: generateId(),
        date,
        training_type_id,
        trainer_id: finalTrainerId,
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
    const { date, training_type_id, trainer_id, hours, start_time, notes } = req.body

    await db.read()

    // Get training type defaults if not provided
    const type = db.data.training_types.find(t => t.id === training_type_id)
    if (!type) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    const finalTrainerId = trainer_id || type.default_trainer_id
    const finalHours = hours || type.default_hours

    const activity = {
      id: generateId(),
      date,
      training_type_id,
      trainer_id: finalTrainerId,
      hours: parseFloat(finalHours),
      start_time: start_time || null,
      series_id: null,
      is_deleted: false,
      notes: notes || null,
      created_at: getCurrentTimestamp()
    }

    db.data.activities.push(activity)
    await db.write()

    const trainer = finalTrainerId ? db.data.trainers.find(t => t.id === finalTrainerId) : null

    res.status(201).json({
      ...activity,
      type_name: type.name,
      type_color: type.color,
      trainer_name: trainer?.name || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create recurring series
router.post('/recurring', authenticateToken, canEdit, validate(createRecurringSchema), async (req, res) => {
  try {
    const { training_type_id, trainer_id, hours, start_time, weekdays, start_date, end_date } = req.body

    await db.read()

    // Get training type defaults
    const type = db.data.training_types.find(t => t.id === training_type_id)
    if (!type) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    const finalTrainerId = trainer_id || type.default_trainer_id
    const finalHours = hours || type.default_hours

    // Create the series
    const series = {
      id: generateId(),
      training_type_id,
      trainer_id: finalTrainerId,
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
        trainer_id: finalTrainerId,
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
    const { trainer_id, hours, start_time, notes } = req.body

    await db.read()

    const activityIndex = db.data.activities.findIndex(a => a.id === id)
    if (activityIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' })
    }

    if (trainer_id !== undefined) db.data.activities[activityIndex].trainer_id = trainer_id
    if (hours !== undefined) db.data.activities[activityIndex].hours = parseFloat(hours)
    if (start_time !== undefined) db.data.activities[activityIndex].start_time = start_time
    if (notes !== undefined) db.data.activities[activityIndex].notes = notes

    await db.write()

    const activity = db.data.activities[activityIndex]
    const type = db.data.training_types.find(t => t.id === activity.training_type_id)
    const trainer = activity.trainer_id ? db.data.trainers.find(t => t.id === activity.trainer_id) : null

    res.json({
      ...activity,
      type_name: type?.name || 'Unknown',
      type_color: type?.color || '#gray',
      trainer_name: trainer?.name || null
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
      const trainer = a.trainer_id ? db.data.trainers.find(t => t.id === a.trainer_id) : null
      const cost = (a.hours || 0) * (trainer?.hourly_cost || 0)

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

    // Summary by trainer
    const byTrainerMap = {}
    yearActivities.forEach(a => {
      if (!a.trainer_id) return
      const trainer = db.data.trainers.find(t => t.id === a.trainer_id)
      if (!trainer) return

      const cost = (a.hours || 0) * (trainer.hourly_cost || 0)

      if (!byTrainerMap[a.trainer_id]) {
        byTrainerMap[a.trainer_id] = {
          id: a.trainer_id,
          name: trainer.name,
          hourly_cost: trainer.hourly_cost,
          session_count: 0,
          total_hours: 0,
          total_cost: 0
        }
      }
      byTrainerMap[a.trainer_id].session_count++
      byTrainerMap[a.trainer_id].total_hours += a.hours || 0
      byTrainerMap[a.trainer_id].total_cost += cost
    })

    // Grand totals
    let totalSessions = 0
    let totalHours = 0
    let totalCost = 0
    yearActivities.forEach(a => {
      const trainer = a.trainer_id ? db.data.trainers.find(t => t.id === a.trainer_id) : null
      totalSessions++
      totalHours += a.hours || 0
      totalCost += (a.hours || 0) * (trainer?.hourly_cost || 0)
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
