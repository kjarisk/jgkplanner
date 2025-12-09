import express from 'express'
import db, { generateId, getCurrentTimestamp } from '../db/init.js'
import { authenticateToken, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Initialize budget and income_entries arrays if they don't exist
async function ensureBudgetTables() {
  await db.read()
  if (!db.data.budgets) {
    db.data.budgets = []
  }
  if (!db.data.income_entries) {
    db.data.income_entries = []
  }
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
        // Get linked activity if any
        let activity = null
        if (i.activity_id) {
          const act = db.data.activities.find(a => a.id === i.activity_id)
          if (act) {
            const type = db.data.training_types.find(t => t.id === act.training_type_id)
            activity = {
              id: act.id,
              date: act.date,
              type_name: type?.name || 'Unknown'
            }
          }
        }
        return {
          ...i,
          activity
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate total income
    const totalIncome = incomeEntries.reduce((sum, i) => sum + (i.amount || 0), 0)

    res.json({
      year: yearNum,
      planned_budget: budget?.planned_budget || 0,
      income_entries: incomeEntries,
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
    const { year, amount, unit_amount, quantity, description, activity_id, date } = req.body

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
      activity_id: activity_id || null,
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
    const { amount, unit_amount, quantity, description, activity_id, date } = req.body

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
    if (activity_id !== undefined) entry.activity_id = activity_id
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

export default router

