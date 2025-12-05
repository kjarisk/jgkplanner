import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Get all trainers
// Admin sees full details including cost
// Others see only name and id
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read()
    
    if (req.user.role === 'admin') {
      const trainers = db.data.trainers
        .map(({ id, name, hourly_cost, created_at }) => ({
          id, name, hourly_cost, created_at
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
      res.json(trainers)
    } else {
      // Non-admin users don't see costs
      const trainers = db.data.trainers
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
      res.json(trainers)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single trainer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await db.read()
    
    const trainer = db.data.trainers.find(t => t.id === id)
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' })
    }

    if (req.user.role === 'admin') {
      res.json({
        id: trainer.id,
        name: trainer.name,
        hourly_cost: trainer.hourly_cost,
        created_at: trainer.created_at
      })
    } else {
      res.json({ id: trainer.id, name: trainer.name })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create trainer (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, hourly_cost = 0 } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    await db.read()

    const trainer = {
      id: generateId(),
      name,
      hourly_cost: parseFloat(hourly_cost) || 0,
      created_at: getCurrentTimestamp()
    }

    db.data.trainers.push(trainer)
    await db.write()

    res.status(201).json(trainer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update trainer (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { name, hourly_cost } = req.body

    await db.read()

    const trainerIndex = db.data.trainers.findIndex(t => t.id === id)
    if (trainerIndex === -1) {
      return res.status(404).json({ error: 'Trainer not found' })
    }

    if (name !== undefined) db.data.trainers[trainerIndex].name = name
    if (hourly_cost !== undefined) db.data.trainers[trainerIndex].hourly_cost = parseFloat(hourly_cost) || 0

    await db.write()
    res.json(db.data.trainers[trainerIndex])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete trainer (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()

    const trainerIndex = db.data.trainers.findIndex(t => t.id === id)
    if (trainerIndex === -1) {
      return res.status(404).json({ error: 'Trainer not found' })
    }

    db.data.trainers.splice(trainerIndex, 1)
    await db.write()

    res.json({ message: 'Trainer deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
