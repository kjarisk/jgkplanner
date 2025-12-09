/**
 * Budget Page - Main budget management page
 * 
 * This is a thin view layer that:
 * - Uses hooks for data management
 * - Delegates to components for UI
 * - Handles routing state (year from URL)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { useBudget, useBudgetSections, useBudgetCosts, useBudgetIncome } from '../hooks/useBudget'
import { LoadingSpinner, Tabs, TabList, Tab, TabPanel } from '../components/common'
import { 
  BudgetHeader, 
  BudgetOverview, 
  BudgetSection, 
  IncomeList,
  SectionManager 
} from '../components/budget'
import { exportBudgetToExcel, exportBudgetToCsv, exportBudgetToPdf } from '../utils/export'
import { formatCurrency } from '../utils/format'

export default function BudgetPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { year: urlYear } = useParams()
  
  // Year state - from URL or current year
  const [year, setYear] = useState(() => {
    const parsedYear = parseInt(urlYear)
    return isNaN(parsedYear) ? new Date().getFullYear() : parsedYear
  })
  
  // UI state
  const [activeTab, setActiveTab] = useState('sections')
  const [showSectionManager, setShowSectionManager] = useState(false)
  
  // Shared data
  const [trainingTypes, setTrainingTypes] = useState([])
  const [trainers, setTrainers] = useState([])
  
  // Budget data hooks
  const { report, loading: reportLoading, setPlannedBudget, refresh: refreshReport } = useBudget(year)
  const { sections, createSection, updateSection, deleteSection, refresh: refreshSections } = useBudgetSections(year)
  const { createCost, updateCost, deleteCost, refresh: refreshCosts } = useBudgetCosts(year)
  const { createIncome, updateIncome, deleteIncome, refresh: refreshIncome } = useBudgetIncome(year)
  
  // Load shared data (training types, trainers)
  useEffect(() => {
    async function loadSharedData() {
      try {
        const [types, trainersList] = await Promise.all([
          api.types.list(),
          api.trainers.list()
        ])
        setTrainingTypes(types)
        setTrainers(trainersList)
      } catch (error) {
        console.error('Failed to load shared data:', error)
      }
    }
    loadSharedData()
  }, [])
  
  // Update URL when year changes
  useEffect(() => {
    navigate(`/budget/${year}`, { replace: true })
  }, [year, navigate])
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshReport(),
      refreshSections(),
      refreshCosts(),
      refreshIncome()
    ])
  }, [refreshReport, refreshSections, refreshCosts, refreshIncome])
  
  // Handle cost operations with refresh
  const handleAddCost = async (data) => {
    await createCost(data)
    await refreshReport()
  }
  
  const handleEditCost = async (id, data) => {
    await updateCost(id, data)
    await refreshReport()
  }
  
  const handleDeleteCost = async (id) => {
    await deleteCost(id)
    await refreshReport()
  }
  
  // Handle income operations with refresh
  const handleAddIncome = async (data) => {
    await createIncome(data)
    await refreshReport()
  }
  
  const handleEditIncome = async (id, data) => {
    await updateIncome(id, data)
    await refreshReport()
  }
  
  const handleDeleteIncome = async (id) => {
    await deleteIncome(id)
    await refreshReport()
  }
  
  // Handle section operations
  const handleCreateSection = async (data) => {
    await createSection(data)
    await refreshReport()
  }
  
  const handleUpdateSection = async (id, data) => {
    await updateSection(id, data)
    await refreshReport()
  }
  
  const handleDeleteSection = async (id) => {
    await deleteSection(id)
    await refreshReport()
  }
  
  // Handle export
  const handleExport = async (format) => {
    if (!report) return
    
    try {
      switch (format) {
        case 'excel':
          await exportBudgetToExcel(report, year)
          break
        case 'csv':
          exportBudgetToCsv(report, year)
          break
        case 'pdf':
          exportBudgetToPdf(report, year)
          break
        case 'print':
          window.print()
          break
        default:
          console.warn('Unknown export format:', format)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Eksport feilet. Prøv igjen.')
    }
  }
  
  // Redirect non-admins
  if (!isAdmin) {
    navigate('/dashboard')
    return null
  }
  
  // Loading state
  if (reportLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <BudgetHeader
        year={year}
        onYearChange={setYear}
        onExport={handleExport}
        onSettings={() => setShowSectionManager(true)}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Cards */}
        <BudgetOverview
          plannedBudget={report?.planned_budget || 0}
          totalCosts={report?.total_costs || 0}
          totalIncome={report?.total_income || 0}
          balance={report?.balance || 0}
          onSetPlannedBudget={setPlannedBudget}
        />
        
        {/* Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="sections">Budsjettseksjoner</Tab>
              <Tab value="income">Inntekter</Tab>
              <Tab value="summary">Sammendrag</Tab>
            </TabList>
            
            {/* Sections Tab */}
            <TabPanel value="sections" className="mt-4 space-y-4">
              {report?.sections?.map(section => (
                <BudgetSection
                  key={section.id}
                  section={section}
                  trainingTypes={trainingTypes}
                  trainers={trainers}
                  onAddCost={handleAddCost}
                  onEditCost={handleEditCost}
                  onDeleteCost={handleDeleteCost}
                />
              ))}
              
              {(!report?.sections || report.sections.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  Ingen seksjoner funnet. Opprett en seksjon for å begynne.
                </div>
              )}
            </TabPanel>
            
            {/* Income Tab */}
            <TabPanel value="income" className="mt-4">
              <IncomeList
                incomeEntries={report?.income_entries || []}
                totalIncome={report?.total_income || 0}
                trainingTypes={trainingTypes}
                onAdd={handleAddIncome}
                onEdit={handleEditIncome}
                onDelete={handleDeleteIncome}
              />
            </TabPanel>
            
            {/* Summary Tab */}
            <TabPanel value="summary" className="mt-4">
              <SummaryView report={report} />
            </TabPanel>
          </Tabs>
        </div>
      </main>
      
      {/* Section Manager Modal */}
      {showSectionManager && (
        <SectionManager
          sections={sections}
          onClose={() => setShowSectionManager(false)}
          onCreate={handleCreateSection}
          onUpdate={handleUpdateSection}
          onDelete={handleDeleteSection}
        />
      )}
    </div>
  )
}

/**
 * Summary View - Shows overall budget summary
 */
function SummaryView({ report }) {
  if (!report) return null
  
  return (
    <div className="space-y-6">
      {/* Section Summaries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
          Sammendrag per seksjon
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50">
              <th className="px-4 py-3">Seksjon</th>
              <th className="px-4 py-3 text-right">Kostnader</th>
              <th className="px-4 py-3 text-right">Inntekter</th>
              <th className="px-4 py-3 text-right">Netto</th>
            </tr>
          </thead>
          <tbody>
            {report.sections?.map(section => (
              <tr key={section.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="font-medium text-gray-900">{section.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">
                  {formatCurrency(section.total_cost)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">
                  {section.total_income > 0 ? formatCurrency(section.total_income) : '-'}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${
                  section.net >= 0 ? 'text-teal-600' : 'text-red-600'
                }`}>
                  {formatCurrency(section.net)}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-50 font-bold">
              <td className="px-4 py-3 text-gray-900">Total</td>
              <td className="px-4 py-3 text-right text-red-600">
                {formatCurrency(report.total_costs)}
              </td>
              <td className="px-4 py-3 text-right text-green-600">
                {formatCurrency(report.total_income)}
              </td>
              <td className={`px-4 py-3 text-right ${
                (report.total_income - report.total_costs) >= 0 ? 'text-teal-600' : 'text-red-600'
              }`}>
                {formatCurrency(report.total_income - report.total_costs)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Activity Summary */}
      {report.activity_summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
            Aktivitetssammendrag
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {report.activity_summary.total_sessions}
                </p>
                <p className="text-sm text-gray-500">Økter</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {report.activity_summary.total_hours?.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Timer</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {report.activity_summary.by_type?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Treningstyper</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Budget Calculation */}
      <div className="bg-slate-100 rounded-xl p-6">
        <h4 className="font-semibold text-slate-700 mb-4">Budsjettberegning</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Planlagt budsjett</span>
            <span className="font-medium">{formatCurrency(report.planned_budget)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">- Totale kostnader</span>
            <span className="font-medium text-red-600">{formatCurrency(report.total_costs)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">+ Totale inntekter</span>
            <span className="font-medium text-green-600">{formatCurrency(report.total_income)}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between font-semibold">
            <span className="text-slate-700">= Resterende budsjett</span>
            <span className={report.balance >= 0 ? 'text-teal-600' : 'text-red-600'}>
              {formatCurrency(report.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
