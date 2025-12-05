import express from 'express'
import db from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Get all users (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    await db.read()
    const users = db.data.users
      .map(({ id, name, email, avatar_url, provider, role, created_at }) => ({
        id, name, email, avatar_url, provider, role, created_at
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['user', 'trainer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    await db.read()

    // Prevent admin from demoting themselves if they're the only admin
    if (req.user.id === id && role !== 'admin') {
      const adminCount = db.data.users.filter(u => u.role === 'admin').length
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the only admin' })
      }
    }

    const userIndex = db.data.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }

    db.data.users[userIndex].role = role
    await db.write()

    const user = db.data.users[userIndex]
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      provider: user.provider,
      role: user.role,
      created_at: user.created_at
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await db.read()
    
    const userIndex = db.data.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }

    db.data.users.splice(userIndex, 1)
    await db.write()

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
