import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Categories for packages
const PACKAGE_CATEGORIES = ['junior', 'voksen', 'alle', 'gratis']

// Get all packages (public - no auth required for viewing)
router.get('/', async (req, res) => {
  try {
    await db.read()
    
    const packages = db.data.packages
      .filter(p => !p.is_deleted)
      .map(pkg => {
        // Enrich with trainer and type info
        const trainers = (pkg.trainer_ids || [])
          .map(id => db.data.trainers.find(t => t.id === id))
          .filter(t => t)
          .map(t => ({ id: t.id, name: t.name }))
        
        const trainingTypes = (pkg.training_type_ids || [])
          .map(id => db.data.training_types.find(t => t.id === id))
          .filter(t => t)
          .map(t => ({ id: t.id, name: t.name, color: t.color }))
        
        return {
          ...pkg,
          trainers,
          training_types: trainingTypes
        }
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    
    res.json(packages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single package
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()
    
    const pkg = db.data.packages.find(p => p.id === id && !p.is_deleted)
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    // Enrich with trainer and type info
    const trainers = (pkg.trainer_ids || [])
      .map(id => db.data.trainers.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name }))
    
    const trainingTypes = (pkg.training_type_ids || [])
      .map(id => db.data.training_types.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name, color: t.color }))
    
    res.json({
      ...pkg,
      trainers,
      training_types: trainingTypes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create package (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      trainer_ids,
      training_type_ids,
      perks,
      requirements,
      period,
      is_featured,
      sort_order
    } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Package name is required' })
    }
    
    if (!PACKAGE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${PACKAGE_CATEGORIES.join(', ')}` })
    }
    
    await db.read()
    
    const pkg = {
      id: generateId(),
      name,
      description: description || '',
      price: price !== undefined ? parseFloat(price) : 0,
      category,
      trainer_ids: trainer_ids || [],
      training_type_ids: training_type_ids || [],
      perks: perks || [],
      requirements: requirements || [],
      period: period || '',
      is_featured: is_featured || false,
      sort_order: sort_order || 0,
      is_deleted: false,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    }
    
    db.data.packages.push(pkg)
    await db.write()
    
    // Return enriched package
    const trainers = (pkg.trainer_ids || [])
      .map(id => db.data.trainers.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name }))
    
    const trainingTypes = (pkg.training_type_ids || [])
      .map(id => db.data.training_types.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name, color: t.color }))
    
    res.status(201).json({
      ...pkg,
      trainers,
      training_types: trainingTypes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update package (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      price,
      category,
      trainer_ids,
      training_type_ids,
      perks,
      requirements,
      period,
      is_featured,
      sort_order
    } = req.body
    
    await db.read()
    
    const pkgIndex = db.data.packages.findIndex(p => p.id === id && !p.is_deleted)
    if (pkgIndex === -1) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    if (category && !PACKAGE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${PACKAGE_CATEGORIES.join(', ')}` })
    }
    
    // Update fields
    if (name !== undefined) db.data.packages[pkgIndex].name = name
    if (description !== undefined) db.data.packages[pkgIndex].description = description
    if (price !== undefined) db.data.packages[pkgIndex].price = parseFloat(price)
    if (category !== undefined) db.data.packages[pkgIndex].category = category
    if (trainer_ids !== undefined) db.data.packages[pkgIndex].trainer_ids = trainer_ids
    if (training_type_ids !== undefined) db.data.packages[pkgIndex].training_type_ids = training_type_ids
    if (perks !== undefined) db.data.packages[pkgIndex].perks = perks
    if (requirements !== undefined) db.data.packages[pkgIndex].requirements = requirements
    if (period !== undefined) db.data.packages[pkgIndex].period = period
    if (is_featured !== undefined) db.data.packages[pkgIndex].is_featured = is_featured
    if (sort_order !== undefined) db.data.packages[pkgIndex].sort_order = sort_order
    
    db.data.packages[pkgIndex].updated_at = getCurrentTimestamp()
    
    await db.write()
    
    const pkg = db.data.packages[pkgIndex]
    
    // Return enriched package
    const trainers = (pkg.trainer_ids || [])
      .map(id => db.data.trainers.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name }))
    
    const trainingTypes = (pkg.training_type_ids || [])
      .map(id => db.data.training_types.find(t => t.id === id))
      .filter(t => t)
      .map(t => ({ id: t.id, name: t.name, color: t.color }))
    
    res.json({
      ...pkg,
      trainers,
      training_types: trainingTypes
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete package (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    
    await db.read()
    
    const pkgIndex = db.data.packages.findIndex(p => p.id === id)
    if (pkgIndex === -1) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    // Soft delete
    db.data.packages[pkgIndex].is_deleted = true
    db.data.packages[pkgIndex].updated_at = getCurrentTimestamp()
    
    await db.write()
    
    res.json({ message: 'Package deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reorder packages (admin only)
router.post('/reorder', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { order } = req.body // Array of { id, sort_order }
    
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: 'Order array is required' })
    }
    
    await db.read()
    
    order.forEach(({ id, sort_order }) => {
      const pkgIndex = db.data.packages.findIndex(p => p.id === id)
      if (pkgIndex !== -1) {
        db.data.packages[pkgIndex].sort_order = sort_order
        db.data.packages[pkgIndex].updated_at = getCurrentTimestamp()
      }
    })
    
    await db.write()
    
    res.json({ message: 'Packages reordered successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
