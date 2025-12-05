import jwt from 'jsonwebtoken'
import db from '../db/init.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production'

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token middleware
export async function authenticateToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    await db.read()
    const user = db.data.users.find(u => u.id === decoded.id)
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Check if user has required role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Check if user can edit (admin or trainer)
export function canEdit(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (!['admin', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  next()
}

// Admin only middleware
export function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}
