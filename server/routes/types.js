import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, canEdit } from '../middleware/auth.js'

const router = express.Router()

// Get all training types
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read()
    
    const types = db.data.training_types.map(type => {
      const trainer = type.default_trainer_id 
        ? db.data.trainers.find(t => t.id === type.default_trainer_id)
        : null
      return {
        ...type,
        default_trainer_name: trainer?.name || null
      }
    }).sort((a, b) => a.name.localeCompare(b.name))

    res.json(types)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single training type
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await db.read()
    
    const type = db.data.training_types.find(t => t.id === id)
    if (!type) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    const trainer = type.default_trainer_id 
      ? db.data.trainers.find(t => t.id === type.default_trainer_id)
      : null

    res.json({
      ...type,
      default_trainer_name: trainer?.name || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create training type (admin or trainer)
router.post('/', authenticateToken, canEdit, async (req, res) => {
  try {
    const { name, color = '#3B82F6', default_trainer_id, default_hours = 2 } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    await db.read()

    const type = {
      id: generateId(),
      name,
      color,
      default_trainer_id: default_trainer_id || null,
      default_hours: parseFloat(default_hours) || 2,
      created_at: getCurrentTimestamp()
    }

    db.data.training_types.push(type)
    await db.write()

    const trainer = type.default_trainer_id 
      ? db.data.trainers.find(t => t.id === type.default_trainer_id)
      : null

    res.status(201).json({
      ...type,
      default_trainer_name: trainer?.name || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update training type (admin or trainer)
router.put('/:id', authenticateToken, canEdit, async (req, res) => {
  try {
    const { id } = req.params
    const { name, color, default_trainer_id, default_hours } = req.body

    await db.read()

    const typeIndex = db.data.training_types.findIndex(t => t.id === id)
    if (typeIndex === -1) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    if (name !== undefined) db.data.training_types[typeIndex].name = name
    if (color !== undefined) db.data.training_types[typeIndex].color = color
    if (default_trainer_id !== undefined) db.data.training_types[typeIndex].default_trainer_id = default_trainer_id || null
    if (default_hours !== undefined) db.data.training_types[typeIndex].default_hours = parseFloat(default_hours) || 2

    await db.write()

    const type = db.data.training_types[typeIndex]
    const trainer = type.default_trainer_id 
      ? db.data.trainers.find(t => t.id === type.default_trainer_id)
      : null

    res.json({
      ...type,
      default_trainer_name: trainer?.name || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete training type (admin or trainer)
router.delete('/:id', authenticateToken, canEdit, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()

    const typeIndex = db.data.training_types.findIndex(t => t.id === id)
    if (typeIndex === -1) {
      return res.status(404).json({ error: 'Training type not found' })
    }

    // Also delete associated activities
    db.data.activities = db.data.activities.filter(a => a.training_type_id !== id)
    db.data.recurring_series = db.data.recurring_series.filter(s => s.training_type_id !== id)
    db.data.training_types.splice(typeIndex, 1)
    
    await db.write()

    res.json({ message: 'Training type deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
