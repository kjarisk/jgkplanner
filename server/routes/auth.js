import express from 'express'
import passport from 'passport'
import { generateToken, authenticateToken } from '../middleware/auth.js'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'

const router = express.Router()

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const token = generateToken(req.user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    res.redirect(`${CLIENT_URL}/dashboard`)
  }
)

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email']
}))

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const token = generateToken(req.user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.redirect(`${CLIENT_URL}/dashboard`)
  }
)

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const { id, name, email, avatar_url, role, created_at } = req.user
  res.json({ id, name, email, avatar_url, role, created_at })
})

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  req.logout?.(() => {})
  res.json({ message: 'Logged out successfully' })
})

// Development only: Create test user
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', async (req, res) => {
    const { role = 'admin' } = req.body
    
    await db.read()
    
    // Check if test user exists
    let user = db.data.users.find(u => u.email === 'dev@test.com')
    
    if (!user) {
      user = {
        id: generateId(),
        name: 'Dev User',
        email: 'dev@test.com',
        avatar_url: null,
        provider: 'dev',
        provider_id: 'dev-123',
        role,
        created_at: getCurrentTimestamp()
      }
      db.data.users.push(user)
      await db.write()
    } else if (user.role !== role) {
      // Update role if different
      user.role = role
      await db.write()
    }

    const token = generateToken(user)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  })
}

export default router
