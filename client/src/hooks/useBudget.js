import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

/**
 * Hook for managing full budget data and operations
 * Handles loading, caching, and CRUD operations for budget report
 */
export function useBudget(year) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load full budget report
  const loadReport = useCallback(async () => {
    if (!year) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.budget.getReport(year)
      setReport(data)
    } catch (err) {
      console.error('Failed to load budget report:', err)
      setError(err.message)
      // Set empty report structure on error
      setReport({
        year,
        planned_budget: 0,
        total_costs: 0,
        total_income: 0,
        balance: 0,
        sections: [],
        income_entries: [],
        activity_summary: { total_sessions: 0, total_hours: 0, by_type: [] }
      })
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // Update planned budget
  const setPlannedBudget = useCallback(async (amount) => {
    try {
      await api.budget.set(year, { planned_budget: amount })
      await loadReport()
      return true
    } catch (err) {
      console.error('Failed to set planned budget:', err)
      setError(err.message)
      return false
    }
  }, [year, loadReport])

  // Refresh data
  const refresh = useCallback(() => {
    return loadReport()
  }, [loadReport])

  return {
    report,
    loading,
    error,
    setPlannedBudget,
    refresh
  }
}

/**
 * Hook for managing budget sections
 */
export function useBudgetSections(year) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSections = useCallback(async () => {
    if (!year) return
    
    setLoading(true)
    try {
      const data = await api.budget.getSections(year)
      setSections(data)
    } catch (err) {
      console.error('Failed to load sections:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  const createSection = useCallback(async (data) => {
    try {
      const section = await api.budget.createSection(year, data)
      setSections(prev => [...prev, section])
      return section
    } catch (err) {
      console.error('Failed to create section:', err)
      throw err
    }
  }, [year])

  const updateSection = useCallback(async (id, data) => {
    try {
      const updated = await api.budget.updateSection(id, data)
      setSections(prev => prev.map(s => s.id === id ? updated : s))
      return updated
    } catch (err) {
      console.error('Failed to update section:', err)
      throw err
    }
  }, [])

  const deleteSection = useCallback(async (id, deleteCosts = false) => {
    try {
      await api.budget.deleteSection(id, deleteCosts)
      setSections(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete section:', err)
      throw err
    }
  }, [])

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    refresh: loadSections
  }
}

/**
 * Hook for managing manual budget costs
 */
export function useBudgetCosts(year) {
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCosts = useCallback(async () => {
    if (!year) return
    
    setLoading(true)
    try {
      const data = await api.budget.getCosts(year)
      setCosts(data)
    } catch (err) {
      console.error('Failed to load costs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadCosts()
  }, [loadCosts])

  const createCost = useCallback(async (data) => {
    try {
      const cost = await api.budget.createCost({ ...data, year })
      setCosts(prev => [...prev, cost])
      return cost
    } catch (err) {
      console.error('Failed to create cost:', err)
      throw err
    }
  }, [year])

  const createCostsBulk = useCallback(async (costsData) => {
    try {
      const newCosts = await api.budget.createCostsBulk(
        costsData.map(c => ({ ...c, year }))
      )
      setCosts(prev => [...prev, ...newCosts])
      return newCosts
    } catch (err) {
      console.error('Failed to create costs:', err)
      throw err
    }
  }, [year])

  const updateCost = useCallback(async (id, data) => {
    try {
      const updated = await api.budget.updateCost(id, data)
      setCosts(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      console.error('Failed to update cost:', err)
      throw err
    }
  }, [])

  const deleteCost = useCallback(async (id) => {
    try {
      await api.budget.deleteCost(id)
      setCosts(prev => prev.filter(c => c.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete cost:', err)
      throw err
    }
  }, [])

  return {
    costs,
    loading,
    error,
    createCost,
    createCostsBulk,
    updateCost,
    deleteCost,
    refresh: loadCosts
  }
}

/**
 * Hook for managing budget income entries
 */
export function useBudgetIncome(year) {
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadIncome = useCallback(async () => {
    if (!year) return
    
    setLoading(true)
    try {
      const data = await api.budget.get(year)
      setIncome(data.income_entries || [])
    } catch (err) {
      console.error('Failed to load income:', err)
      setError(err.message)
      setIncome([])
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadIncome()
  }, [loadIncome])

  const createIncome = useCallback(async (data) => {
    try {
      const entry = await api.budget.addIncome({ ...data, year })
      setIncome(prev => [...prev, entry])
      return entry
    } catch (err) {
      console.error('Failed to create income:', err)
      throw err
    }
  }, [year])

  const updateIncome = useCallback(async (id, data) => {
    try {
      const updated = await api.budget.updateIncome(id, data)
      setIncome(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i))
      return updated
    } catch (err) {
      console.error('Failed to update income:', err)
      throw err
    }
  }, [])

  const deleteIncome = useCallback(async (id) => {
    try {
      await api.budget.deleteIncome(id)
      setIncome(prev => prev.filter(i => i.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete income:', err)
      throw err
    }
  }, [])

  return {
    income,
    loading,
    error,
    createIncome,
    updateIncome,
    deleteIncome,
    refresh: loadIncome
  }
}
