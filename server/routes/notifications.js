import express from 'express'
import db from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Get all notifications (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { unread_only } = req.query
    
    await db.read()
    
    let notifications = db.data.notifications
    if (unread_only === 'true') {
      notifications = notifications.filter(n => !n.is_read)
    }

    // Sort by date descending and limit to 50
    notifications = notifications
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      .map(n => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null
      }))

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get unread count (admin only)
router.get('/unread-count', authenticateToken, adminOnly, async (req, res) => {
  try {
    await db.read()
    const count = db.data.notifications.filter(n => !n.is_read).length
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark notification as read (admin only)
router.patch('/:id/read', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()

    const notificationIndex = db.data.notifications.findIndex(n => n.id === id)
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    db.data.notifications[notificationIndex].is_read = 1
    await db.write()

    const notification = db.data.notifications[notificationIndex]
    res.json({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark all as read (admin only)
router.post('/mark-all-read', authenticateToken, adminOnly, async (req, res) => {
  try {
    await db.read()
    db.data.notifications.forEach(n => n.is_read = 1)
    await db.write()
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete notification (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()

    const notificationIndex = db.data.notifications.findIndex(n => n.id === id)
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    db.data.notifications.splice(notificationIndex, 1)
    await db.write()

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
