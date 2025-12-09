import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Default budget sections
const DEFAULT_SECTIONS = [
  { name: 'Trening', color: '#14b8a6', type: 'auto', order: 0 },
  { name: 'Konkurranser', color: '#f59e0b', type: 'manual', order: 1 },
  { name: 'Utstyr', color: '#ef4444', type: 'manual', order: 2 },
  { name: 'Utdanning', color: '#8b5cf6', type: 'manual', order: 3 },
  { name: 'Annet', color: '#6b7280', type: 'manual', order: 4 }
]

// Initialize budget tables if they don't exist
async function ensureBudgetTables() {
  await db.read()
  if (!db.data.budgets) {
    db.data.budgets = []
  }
  if (!db.data.income_entries) {
    db.data.income_entries = []
  }
  if (!db.data.budget_sections) {
    db.data.budget_sections = []
  }
  if (!db.data.budget_costs) {
    db.data.budget_costs = []
  }
}

// Helper: Get or create default sections for a year
async function ensureDefaultSections(year) {
  await ensureBudgetTables()
  
  const existingSections = db.data.budget_sections.filter(s => s.year === year)
  if (existingSections.length === 0) {
    // Create default sections for this year
    const newSections = DEFAULT_SECTIONS.map(s => ({
      id: generateId(),
      year,
      name: s.name,
      color: s.color,
      type: s.type,
      order: s.order,
      created_at: getCurrentTimestamp()
    }))
    db.data.budget_sections.push(...newSections)
    await db.write()
    return newSections
  }
  return existingSections.sort((a, b) => a.order - b.order)
}

// Get budget and income for a year (admin only)
router.get('/:year', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { year } = req.params
    const yearNum = parseInt(year)

    await ensureBudgetTables()

    // Get budget for year
    const budget = db.data.budgets.find(b => b.year === yearNum)

    // Get income entries for year
    const incomeEntries = db.data.income_entries
      .filter(i => i.year === yearNum)
      .map(i => {
        // Get linked training type if any
        let training_type = null
        if (i.training_type_id) {
          const type = db.data.training_types.find(t => t.id === i.training_type_id)
          if (type) {
            training_type = {
              id: type.id,
              name: type.name,
              color: type.color
            }
          }
        }
        return {
          ...i,
          training_type
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate income by training type
    const incomeByType = {}
    incomeEntries.forEach(entry => {
      const typeId = entry.training_type_id || 'unassigned'
      if (!incomeByType[typeId]) {
        incomeByType[typeId] = {
          training_type_id: typeId === 'unassigned' ? null : typeId,
          training_type: entry.training_type,
          total: 0,
          entries: []
        }
      }
      incomeByType[typeId].total += entry.amount || 0
      incomeByType[typeId].entries.push(entry)
    })

    // Calculate total income
    const totalIncome = incomeEntries.reduce((sum, i) => sum + (i.amount || 0), 0)

    res.json({
      year: yearNum,
      planned_budget: budget?.planned_budget || 0,
      income_entries: incomeEntries,
      income_by_type: Object.values(incomeByType),
      total_income: totalIncome
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Set planned budget for a year (admin only)
router.put('/:year', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { year } = req.params
    const { planned_budget } = req.body
    const yearNum = parseInt(year)

    if (planned_budget === undefined || planned_budget < 0) {
      return res.status(400).json({ error: 'Valid planned_budget is required' })
    }

    await ensureBudgetTables()

    const existingIndex = db.data.budgets.findIndex(b => b.year === yearNum)

    if (existingIndex >= 0) {
      db.data.budgets[existingIndex].planned_budget = parseFloat(planned_budget)
      db.data.budgets[existingIndex].updated_at = getCurrentTimestamp()
    } else {
      db.data.budgets.push({
        id: generateId(),
        year: yearNum,
        planned_budget: parseFloat(planned_budget),
        created_at: getCurrentTimestamp()
      })
    }

    await db.write()

    res.json({
      year: yearNum,
      planned_budget: parseFloat(planned_budget)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add income entry (admin only)
router.post('/income', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { year, amount, unit_amount, quantity, description, training_type_id, date } = req.body

    if (!year || !date) {
      return res.status(400).json({ error: 'Year and date are required' })
    }

    // Support both old (amount) and new (unit_amount × quantity) formats
    let finalAmount = 0
    let finalUnitAmount = null
    let finalQuantity = null

    if (unit_amount !== undefined) {
      // New format: unit_amount × quantity
      finalUnitAmount = parseFloat(unit_amount) || 0
      finalQuantity = parseInt(quantity) || 1
      finalAmount = finalUnitAmount * finalQuantity
    } else if (amount !== undefined) {
      // Legacy format: just amount
      finalAmount = parseFloat(amount) || 0
    } else {
      return res.status(400).json({ error: 'Either amount or unit_amount is required' })
    }

    await ensureBudgetTables()

    const incomeEntry = {
      id: generateId(),
      year: parseInt(year),
      amount: finalAmount,
      unit_amount: finalUnitAmount,
      quantity: finalQuantity,
      description: description || '',
      training_type_id: training_type_id || null,
      date,
      created_at: getCurrentTimestamp()
    }

    db.data.income_entries.push(incomeEntry)
    await db.write()

    res.status(201).json(incomeEntry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update income entry (admin only)
router.put('/income/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { amount, unit_amount, quantity, description, training_type_id, date } = req.body

    await ensureBudgetTables()

    const incomeIndex = db.data.income_entries.findIndex(i => i.id === id)
    if (incomeIndex === -1) {
      return res.status(404).json({ error: 'Income entry not found' })
    }

    const entry = db.data.income_entries[incomeIndex]

    // Handle unit_amount × quantity calculation
    if (unit_amount !== undefined || quantity !== undefined) {
      entry.unit_amount = unit_amount !== undefined ? parseFloat(unit_amount) : entry.unit_amount
      entry.quantity = quantity !== undefined ? parseInt(quantity) : entry.quantity
      // Recalculate total if we have both values
      if (entry.unit_amount !== null && entry.quantity !== null) {
        entry.amount = entry.unit_amount * entry.quantity
      }
    } else if (amount !== undefined) {
      entry.amount = parseFloat(amount)
    }

    if (description !== undefined) entry.description = description
    if (training_type_id !== undefined) entry.training_type_id = training_type_id
    if (date !== undefined) entry.date = date

    await db.write()

    res.json(entry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete income entry (admin only)
router.delete('/income/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    await ensureBudgetTables()

    const incomeIndex = db.data.income_entries.findIndex(i => i.id === id)
    if (incomeIndex === -1) {
      return res.status(404).json({ error: 'Income entry not found' })
    }

    db.data.income_entries.splice(incomeIndex, 1)
    await db.write()

    res.json({ message: 'Income entry deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// BUDGET SECTIONS
// ============================================

// Get all sections for a year
router.get('/:year/sections', authenticateToken, adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const sections = await ensureDefaultSections(year)
    res.json(sections)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a new section
router.post('/:year/sections', authenticateToken, adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const { name, color, type = 'manual' } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Section name is required' })
    }

    await ensureBudgetTables()
    
    // Get max order
    const existingSections = db.data.budget_sections.filter(s => s.year === year)
    const maxOrder = existingSections.reduce((max, s) => Math.max(max, s.order || 0), -1)

    const section = {
      id: generateId(),
      year,
      name,
      color: color || '#6b7280',
      type,
      order: maxOrder + 1,
      created_at: getCurrentTimestamp()
    }

    db.data.budget_sections.push(section)
    await db.write()

    res.status(201).json(section)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a section
router.put('/sections/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { name, color, order } = req.body

    await ensureBudgetTables()

    const sectionIndex = db.data.budget_sections.findIndex(s => s.id === id)
    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const section = db.data.budget_sections[sectionIndex]
    if (name !== undefined) section.name = name
    if (color !== undefined) section.color = color
    if (order !== undefined) section.order = order
    section.updated_at = getCurrentTimestamp()

    await db.write()
    res.json(section)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a section (and optionally its costs)
router.delete('/sections/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { deleteCosts = false } = req.query

    await ensureBudgetTables()

    const sectionIndex = db.data.budget_sections.findIndex(s => s.id === id)
    if (sectionIndex === -1) {
      return res.status(404).json({ error: 'Section not found' })
    }

    // Don't allow deleting the 'auto' type section (Trening)
    if (db.data.budget_sections[sectionIndex].type === 'auto') {
      return res.status(400).json({ error: 'Cannot delete the training section' })
    }

    // Remove the section
    db.data.budget_sections.splice(sectionIndex, 1)

    // Optionally delete associated costs
    if (deleteCosts === 'true') {
      db.data.budget_costs = db.data.budget_costs.filter(c => c.section_id !== id)
    } else {
      // Move costs to 'Annet' section or unassign
      db.data.budget_costs.forEach(c => {
        if (c.section_id === id) {
          c.section_id = null
        }
      })
    }

    await db.write()
    res.json({ message: 'Section deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// BUDGET COSTS (Manual cost entries)
// ============================================

// Get all costs for a year
router.get('/:year/costs', authenticateToken, adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    
    await ensureBudgetTables()

    const costs = db.data.budget_costs
      .filter(c => c.year === year)
      .map(c => {
        // Enrich with related data
        let section = null
        let training_type = null
        let trainer = null

        if (c.section_id) {
          const s = db.data.budget_sections.find(s => s.id === c.section_id)
          if (s) section = { id: s.id, name: s.name, color: s.color }
        }
        if (c.training_type_id) {
          const t = db.data.training_types.find(t => t.id === c.training_type_id)
          if (t) training_type = { id: t.id, name: t.name, color: t.color }
        }
        if (c.trainer_id) {
          const t = db.data.trainers.find(t => t.id === c.trainer_id)
          if (t) trainer = { id: t.id, name: t.name }
        }

        return { ...c, section, training_type, trainer }
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    res.json(costs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a new cost entry
router.post('/costs', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { 
      year, 
      section_id,
      description,
      units = 1,
      unit_cost = 0,
      is_planned = true,
      training_type_id = null,
      trainer_id = null,
      notes = ''
    } = req.body

    if (!year || !description) {
      return res.status(400).json({ error: 'Year and description are required' })
    }

    await ensureBudgetTables()

    // Get max order for section
    const existingCosts = db.data.budget_costs.filter(
      c => c.year === year && c.section_id === section_id
    )
    const maxOrder = existingCosts.reduce((max, c) => Math.max(max, c.order || 0), -1)

    const cost = {
      id: generateId(),
      year: parseInt(year),
      section_id: section_id || null,
      description,
      units: parseFloat(units) || 1,
      unit_cost: parseFloat(unit_cost) || 0,
      total: (parseFloat(units) || 1) * (parseFloat(unit_cost) || 0),
      is_planned,
      training_type_id,
      trainer_id,
      notes,
      order: maxOrder + 1,
      created_at: getCurrentTimestamp()
    }

    db.data.budget_costs.push(cost)
    await db.write()

    res.status(201).json(cost)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create multiple cost entries at once
router.post('/costs/bulk', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { costs } = req.body

    if (!costs || !Array.isArray(costs) || costs.length === 0) {
      return res.status(400).json({ error: 'Costs array is required' })
    }

    await ensureBudgetTables()

    const createdCosts = []
    for (const costData of costs) {
      const { 
        year, 
        section_id,
        description,
        units = 1,
        unit_cost = 0,
        is_planned = true,
        training_type_id = null,
        trainer_id = null,
        notes = ''
      } = costData

      if (!year || !description) continue

      const existingCosts = db.data.budget_costs.filter(
        c => c.year === parseInt(year) && c.section_id === section_id
      )
      const maxOrder = existingCosts.reduce((max, c) => Math.max(max, c.order || 0), -1)

      const cost = {
        id: generateId(),
        year: parseInt(year),
        section_id: section_id || null,
        description,
        units: parseFloat(units) || 1,
        unit_cost: parseFloat(unit_cost) || 0,
        total: (parseFloat(units) || 1) * (parseFloat(unit_cost) || 0),
        is_planned,
        training_type_id,
        trainer_id,
        notes,
        order: maxOrder + 1 + createdCosts.length,
        created_at: getCurrentTimestamp()
      }

      db.data.budget_costs.push(cost)
      createdCosts.push(cost)
    }

    await db.write()
    res.status(201).json(createdCosts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a cost entry
router.put('/costs/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      section_id,
      description,
      units,
      unit_cost,
      is_planned,
      training_type_id,
      trainer_id,
      notes,
      order
    } = req.body

    await ensureBudgetTables()

    const costIndex = db.data.budget_costs.findIndex(c => c.id === id)
    if (costIndex === -1) {
      return res.status(404).json({ error: 'Cost entry not found' })
    }

    const cost = db.data.budget_costs[costIndex]
    
    if (section_id !== undefined) cost.section_id = section_id
    if (description !== undefined) cost.description = description
    if (units !== undefined) cost.units = parseFloat(units) || 1
    if (unit_cost !== undefined) cost.unit_cost = parseFloat(unit_cost) || 0
    if (is_planned !== undefined) cost.is_planned = is_planned
    if (training_type_id !== undefined) cost.training_type_id = training_type_id
    if (trainer_id !== undefined) cost.trainer_id = trainer_id
    if (notes !== undefined) cost.notes = notes
    if (order !== undefined) cost.order = order

    // Recalculate total
    cost.total = cost.units * cost.unit_cost
    cost.updated_at = getCurrentTimestamp()

    await db.write()
    res.json(cost)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a cost entry
router.delete('/costs/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    await ensureBudgetTables()

    const costIndex = db.data.budget_costs.findIndex(c => c.id === id)
    if (costIndex === -1) {
      return res.status(404).json({ error: 'Cost entry not found' })
    }

    db.data.budget_costs.splice(costIndex, 1)
    await db.write()

    res.json({ message: 'Cost entry deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// FULL BUDGET REPORT
// ============================================

// Get complete budget report for a year
router.get('/:year/report', authenticateToken, adminOnly, async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    
    await ensureBudgetTables()
    
    // Get sections
    const sections = await ensureDefaultSections(year)
    
    // Get budget settings
    const budgetSettings = db.data.budgets.find(b => b.year === year)
    
    // Get manual costs
    const manualCosts = db.data.budget_costs.filter(c => c.year === year)
    
    // Get income entries
    const incomeEntries = db.data.income_entries.filter(i => i.year === year)
    
    // Get activity-based costs (from activities)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const activities = db.data.activities.filter(
      a => a.date >= startDate && a.date <= endDate && !a.is_deleted
    )
    
    // Calculate activity costs by type
    const activityCostsByType = {}
    activities.forEach(activity => {
      const typeId = activity.training_type_id
      const type = db.data.training_types.find(t => t.id === typeId)
      
      // Get trainer costs
      const trainerIds = activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : [])
      let activityCost = 0
      trainerIds.forEach(trainerId => {
        const trainer = db.data.trainers.find(t => t.id === trainerId)
        if (trainer) {
          activityCost += (activity.hours || 0) * (trainer.hourly_cost || 0)
        }
      })
      
      if (!activityCostsByType[typeId]) {
        activityCostsByType[typeId] = {
          training_type_id: typeId,
          training_type: type ? { id: type.id, name: type.name, color: type.color } : null,
          session_count: 0,
          total_hours: 0,
          total_cost: 0
        }
      }
      
      activityCostsByType[typeId].session_count++
      activityCostsByType[typeId].total_hours += activity.hours || 0
      activityCostsByType[typeId].total_cost += activityCost
    })
    
    // Build section summaries
    const sectionSummaries = sections.map(section => {
      let costs = []
      let totalCost = 0
      let totalIncome = 0
      
      if (section.type === 'auto') {
        // Training section - use activity costs
        costs = Object.values(activityCostsByType).map(ac => ({
          id: `activity-${ac.training_type_id}`,
          description: ac.training_type?.name || 'Unknown',
          units: ac.total_hours,
          unit_cost: ac.total_cost / (ac.total_hours || 1),
          total: ac.total_cost,
          session_count: ac.session_count,
          training_type: ac.training_type,
          is_activity: true
        }))
        totalCost = costs.reduce((sum, c) => sum + c.total, 0)
        
        // Get income linked to training types
        incomeEntries.forEach(income => {
          if (income.training_type_id && activityCostsByType[income.training_type_id]) {
            totalIncome += income.amount || 0
          }
        })
      } else {
        // Manual section
        costs = manualCosts
          .filter(c => c.section_id === section.id)
          .map(c => {
            const training_type = c.training_type_id 
              ? db.data.training_types.find(t => t.id === c.training_type_id)
              : null
            return {
              ...c,
              training_type: training_type ? { id: training_type.id, name: training_type.name, color: training_type.color } : null
            }
          })
          .sort((a, b) => (a.order || 0) - (b.order || 0))
        
        totalCost = costs.reduce((sum, c) => sum + (c.total || 0), 0)
        
        // Get income linked to this section's costs
        costs.forEach(cost => {
          if (cost.training_type_id) {
            const relatedIncome = incomeEntries.filter(i => i.training_type_id === cost.training_type_id)
            totalIncome += relatedIncome.reduce((sum, i) => sum + (i.amount || 0), 0)
          }
        })
      }
      
      return {
        ...section,
        costs,
        total_cost: totalCost,
        total_income: totalIncome,
        net: totalIncome - totalCost
      }
    })
    
    // Calculate totals
    const totalPlannedBudget = budgetSettings?.planned_budget || 0
    const totalCosts = sectionSummaries.reduce((sum, s) => sum + s.total_cost, 0)
    const totalIncome = incomeEntries.reduce((sum, i) => sum + (i.amount || 0), 0)
    const balance = totalPlannedBudget - totalCosts + totalIncome
    
    // Income entries with enriched data
    const enrichedIncomeEntries = incomeEntries.map(i => {
      let training_type = null
      if (i.training_type_id) {
        const type = db.data.training_types.find(t => t.id === i.training_type_id)
        if (type) training_type = { id: type.id, name: type.name, color: type.color }
      }
      return { ...i, training_type }
    }).sort((a, b) => a.date.localeCompare(b.date))
    
    res.json({
      year,
      planned_budget: totalPlannedBudget,
      total_costs: totalCosts,
      total_income: totalIncome,
      balance,
      sections: sectionSummaries,
      income_entries: enrichedIncomeEntries,
      activity_summary: {
        total_sessions: activities.length,
        total_hours: activities.reduce((sum, a) => sum + (a.hours || 0), 0),
        by_type: Object.values(activityCostsByType)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

