import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUndo } from '../context/UndoContext'
import { api } from '../api'
import { getWeekStart } from '../utils/date'
import { useMobile } from '../hooks/useMobile'
import Sidebar from '../components/Sidebar'
import Calendar from '../components/Calendar'
import ActivityModal from '../components/ActivityModal'
import TrainingTypeModal from '../components/TrainingTypeModal'
import UpcomingTrainings from '../components/UpcomingTrainings'
import BottomSheet from '../components/BottomSheet'

export default function Dashboard() {
  const { user, isAdmin, canEdit } = useAuth()
  const { addAction, toast, clearToast, undo, redo } = useUndo()
  const isMobile = useMobile()
  const navigate = useNavigate()
  const { year: urlYear } = useParams()
  
  // Year from URL or default to current year
  const [year, setYear] = useState(() => {
    const parsedYear = parseInt(urlYear)
    return isNaN(parsedYear) ? new Date().getFullYear() : parsedYear
  })
  
  const [activities, setActivities] = useState([])
  const [trainingTypes, setTrainingTypes] = useState([])
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // View mode state
  const [viewMode, setViewMode] = useState('year') // 'year' | 'month' | 'week'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart(new Date()))
  
  // Trainer filter state - Set of hidden trainer IDs
  const [hiddenTrainers, setHiddenTrainers] = useState(new Set())
  
  // Get trainers who have activities in this year
  const activeTrainers = useMemo(() => {
    const trainerIds = new Set()
    activities.forEach(activity => {
      // Handle both trainer_ids array and legacy trainer_id
      const ids = activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : [])
      ids.forEach(id => trainerIds.add(id))
    })
    return trainers.filter(t => trainerIds.has(t.id))
  }, [activities, trainers])
  
  // Filter activities by hidden trainers
  const filteredActivities = useMemo(() => {
    if (hiddenTrainers.size === 0) return activities
    return activities.filter(activity => {
      const ids = activity.trainer_ids || (activity.trainer_id ? [activity.trainer_id] : [])
      // Show activity if ANY of its trainers are visible
      return ids.some(id => !hiddenTrainers.has(id))
    })
  }, [activities, hiddenTrainers])
  
  // Sync URL with year
  useEffect(() => {
    navigate(`/dashboard/${year}`, { replace: true })
  }, [year, navigate])
  
  // Update year if URL changes
  useEffect(() => {
    const parsedYear = parseInt(urlYear)
    if (!isNaN(parsedYear) && parsedYear !== year) {
      setYear(parsedYear)
    }
  }, [urlYear])
  
  // Ghost dates for recurring preview
  const [ghostDates, setGhostDates] = useState([])
  const [ghostTypeId, setGhostTypeId] = useState(null)
  
  // Copy week state
  const [copiedWeek, setCopiedWeek] = useState(null)
  const [pasteConfirmDialog, setPasteConfirmDialog] = useState(null)
  
  // Bottom sheet state (for mobile)
  const [bottomSheet, setBottomSheet] = useState({ open: false, date: null, activities: [] })
  
  // Modal states
  const [activityModal, setActivityModal] = useState({ 
    open: false, 
    date: null, 
    activity: null,
    activities: [],
    mode: 'add'
  })
  const [typeModal, setTypeModal] = useState({ open: false, type: null })

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (activityModal.open) {
          setActivityModal({ open: false, date: null, activity: null, activities: [], mode: 'add' })
        }
        if (typeModal.open) {
          setTypeModal({ open: false, type: null })
        }
        if (bottomSheet.open) {
          setBottomSheet({ open: false, date: null, activities: [] })
        }
        return
      }
      
      // N: New activity (today)
      if (e.key === 'n' || e.key === 'N') {
        if (canEdit && !activityModal.open) {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          handleAddActivity(todayStr)
        }
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activityModal.open, typeModal.open, bottomSheet.open, canEdit, undo])

  useEffect(() => {
    loadData()
  }, [year])

  async function loadData() {
    setLoading(true)
    try {
      const [activitiesData, typesData, trainersData] = await Promise.all([
        api.activities.getByYear(year),
        api.types.list(),
        api.trainers.list()
      ])
      setActivities(activitiesData)
      setTrainingTypes(typesData)
      setTrainers(trainersData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle cell click - can receive specific activity or list of activities
  function handleCellClick(date, activity = null, dayActivities = []) {
    if (!canEdit) return
    
    // On mobile, use bottom sheet
    if (isMobile && dayActivities.length > 0) {
      setBottomSheet({ open: true, date, activities: dayActivities })
      return
    }
    
    if (activity) {
      setActivityModal({ 
        open: true, 
        date, 
        activity,
        activities: dayActivities.length > 0 ? dayActivities : activities.filter(a => a.date === date),
        mode: 'edit'
      })
    } else if (dayActivities.length > 0) {
      setActivityModal({ 
        open: true, 
        date, 
        activity: null,
        activities: dayActivities,
        mode: 'list'
      })
    } else {
      setActivityModal({ 
        open: true, 
        date, 
        activity: null,
        activities: [],
        mode: 'add'
      })
    }
  }

  // Handle add activity (from right-click menu or FAB)
  function handleAddActivity(date) {
    if (!canEdit) return
    setActivityModal({ 
      open: true, 
      date, 
      activity: null,
      activities: activities.filter(a => a.date === date),
      mode: 'add'
    })
  }

  // Handle activity saved with undo support
  async function handleActivitySaved(actionData = null) {
    setActivityModal({ open: false, date: null, activity: null, activities: [], mode: 'add' })
    setGhostDates([])
    setGhostTypeId(null)
    
    // Add to undo stack if action data provided
    if (actionData) {
      addAction(actionData)
    }
    
    await loadData()
  }

  function handleTypeSaved() {
    setTypeModal({ open: false, type: null })
    loadData()
  }

  // Handle preview dates for recurring activities (memoized to prevent infinite loops)
  const handlePreviewDates = useCallback((dates, typeId) => {
    setGhostDates(dates || [])
    setGhostTypeId(typeId || null)
  }, [])

  // Handle copy week
  function handleCopyWeek(weekStart, weekNumber) {
    const weekActivities = []
    
    // Get all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart)
      dayDate.setDate(dayDate.getDate() + i)
      const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
      
      const dayActs = activities.filter(a => a.date === dateStr)
      dayActs.forEach(a => {
        weekActivities.push({
          ...a,
          dayOfWeek: i // Store which day of week (0=Sunday)
        })
      })
    }
    
    if (weekActivities.length === 0) {
      return
    }
    
    setCopiedWeek({
      activities: weekActivities,
      weekNumber
    })
  }

  // Handle paste week
  function handlePasteWeek(targetWeekStart, targetWeekNumber) {
    if (!copiedWeek) return
    
    setPasteConfirmDialog({
      sourceWeek: copiedWeek.weekNumber,
      targetWeek: targetWeekNumber,
      activityCount: copiedWeek.activities.length
    })
  }

  // Confirm paste week
  async function confirmPasteWeek() {
    if (!copiedWeek || !selectedWeekStart) {
      setPasteConfirmDialog(null)
      return
    }
    
    try {
      const newActivities = copiedWeek.activities.map(a => {
        // Calculate new date based on day of week offset from week start
        const newDate = new Date(selectedWeekStart)
        newDate.setDate(newDate.getDate() + a.dayOfWeek)
        const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
        
        return {
          date: dateStr,
          training_type_id: a.training_type_id,
          trainer_id: a.trainer_id,
          hours: a.hours,
          start_time: a.start_time,
          notes: a.notes
        }
      })
      
      // Create activities using bulk endpoint
      await api.activities.createBulk(newActivities)
      
      // Add to undo stack
      addAction({
        type: 'paste_week',
        message: `Pasted ${newActivities.length} activities`
      })
      
      await loadData()
    } catch (error) {
      console.error('Failed to paste week:', error)
    } finally {
      setPasteConfirmDialog(null)
    }
  }

  // Handle bottom sheet action
  function handleBottomSheetAction(action, activity = null) {
    setBottomSheet({ open: false, date: null, activities: [] })
    
    if (action === 'add') {
      handleAddActivity(bottomSheet.date)
    } else if (action === 'edit' && activity) {
      setActivityModal({
        open: true,
        date: bottomSheet.date,
        activity,
        activities: bottomSheet.activities,
        mode: 'edit'
      })
    }
  }

  // FAB click handler
  function handleFabClick() {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    handleAddActivity(todayStr)
  }

  // Helper: Get first week that starts in a given month
  function getFirstWeekOfMonth(targetYear, targetMonth) {
    // Start from the 1st of the month and find the first Sunday
    const firstOfMonth = new Date(targetYear, targetMonth, 1)
    const dayOfWeek = firstOfMonth.getDay() // 0 = Sunday
    
    if (dayOfWeek === 0) {
      // 1st is already a Sunday
      return firstOfMonth
    } else {
      // Find the next Sunday (first full week in this month)
      const daysUntilSunday = 7 - dayOfWeek
      const firstSunday = new Date(targetYear, targetMonth, 1 + daysUntilSunday)
      return firstSunday
    }
  }

  // Smart year change handler
  function handleYearChange(newYear) {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    if (viewMode === 'month') {
      // When changing year in month view, go to smart month
      if (newYear === currentYear) {
        setSelectedMonth(now.getMonth())
      } else if (newYear > currentYear) {
        setSelectedMonth(0) // January for future years
      } else {
        setSelectedMonth(11) // December for past years
      }
    } else if (viewMode === 'week') {
      // When changing year in week view, go to smart week
      if (newYear === currentYear) {
        setSelectedWeekStart(getWeekStart(now))
      } else if (newYear > currentYear) {
        // First week that starts IN the new year (January)
        setSelectedWeekStart(getFirstWeekOfMonth(newYear, 0))
      } else {
        // Last week of December for past years
        setSelectedWeekStart(getFirstWeekOfMonth(newYear, 11))
      }
    }
    
    setYear(newYear)
  }

  // Smart view mode change handler
  function handleViewModeChange(newMode) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    if (newMode === 'month') {
      if (viewMode === 'week') {
        // Week → Month: Go to month containing the middle of the week (Wednesday)
        const midWeek = new Date(selectedWeekStart)
        midWeek.setDate(midWeek.getDate() + 3) // Wednesday
        setSelectedMonth(midWeek.getMonth())
      } else if (viewMode === 'year') {
        // Year → Month: Go to nearest month
        if (year === currentYear) {
          setSelectedMonth(currentMonth)
        } else if (year > currentYear) {
          setSelectedMonth(0) // January for future years
        } else {
          setSelectedMonth(11) // December for past years
        }
      }
    } else if (newMode === 'week') {
      if (viewMode === 'month') {
        // Month → Week: First week that starts in selected month
        setSelectedWeekStart(getFirstWeekOfMonth(year, selectedMonth))
      } else if (viewMode === 'year') {
        // Year → Week: Nearest week
        if (year === currentYear) {
          setSelectedWeekStart(getWeekStart(now))
        } else if (year > currentYear) {
          // First week that starts IN the year (January)
          setSelectedWeekStart(getFirstWeekOfMonth(year, 0))
        } else {
          // Last week of December for past years
          setSelectedWeekStart(getFirstWeekOfMonth(year, 11))
        }
      }
    }
    
    setViewMode(newMode)
  }

  // Toggle trainer visibility
  function handleToggleTrainer(trainerId) {
    setHiddenTrainers(prev => {
      const next = new Set(prev)
      if (next.has(trainerId)) {
        next.delete(trainerId)
      } else {
        next.add(trainerId)
      }
      return next
    })
  }

  // Show all trainers
  function handleShowAllTrainers() {
    setHiddenTrainers(new Set())
  }

  // Hide all trainers except one
  function handleShowOnlyTrainer(trainerId) {
    const newHidden = new Set(activeTrainers.map(t => t.id))
    newHidden.delete(trainerId)
    setHiddenTrainers(newHidden)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - hidden on mobile */}
      <div className={`${isMobile ? 'hidden' : 'block'}`}>
        <Sidebar
          year={year}
          onYearChange={handleYearChange}
          trainingTypes={trainingTypes}
          onAddType={() => setTypeModal({ open: true, type: null })}
          onEditType={(type) => setTypeModal({ open: true, type })}
          isAdmin={isAdmin}
          canEdit={canEdit}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sports Calendar {year}</h1>
            <p className="text-xs md:text-sm text-gray-500">
              {user?.role === 'admin' && 'Administrator'}
              {user?.role === 'trainer' && 'Trainer'}
              {user?.role === 'user' && 'Viewer'}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile year selector */}
            {isMobile && (
              <select
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1"
              >
                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            <span className="text-sm text-gray-600 hidden md:inline">{user?.name}</span>
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            )}
          </div>
        </header>

        {/* Calendar */}
        <div className="p-2 md:p-4 overflow-auto h-[calc(100vh-60px)] md:h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <>
              <Calendar
                year={year}
                activities={filteredActivities}
                trainingTypes={trainingTypes}
                trainers={activeTrainers}
                hiddenTrainers={hiddenTrainers}
                onToggleTrainer={handleToggleTrainer}
                onShowAllTrainers={handleShowAllTrainers}
                onShowOnlyTrainer={handleShowOnlyTrainer}
                onCellClick={handleCellClick}
                onAddActivity={handleAddActivity}
                canEdit={canEdit}
                viewMode={viewMode}
                selectedMonth={selectedMonth}
                selectedWeekStart={selectedWeekStart}
                onViewModeChange={handleViewModeChange}
                onMonthChange={setSelectedMonth}
                onWeekChange={setSelectedWeekStart}
                ghostDates={ghostDates}
                ghostTypeId={ghostTypeId}
                copiedWeek={copiedWeek}
                onCopyWeek={handleCopyWeek}
                onPasteWeek={handlePasteWeek}
              />
              
              {/* Upcoming Trainings List */}
              {!isMobile && (
                <UpcomingTrainings
                  activities={activities}
                  trainingTypes={trainingTypes}
                  trainers={trainers}
                  year={year}
                  onActivityUpdated={loadData}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      {isMobile && canEdit && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center z-30"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slideIn">
          <span>{toast.message}</span>
          <button
            onClick={undo}
            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 rounded text-sm font-medium transition-colors"
          >
            Undo
          </button>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Activity Modal */}
      {activityModal.open && (
        <ActivityModal
          date={activityModal.date}
          activity={activityModal.activity}
          activities={activityModal.activities}
          initialMode={activityModal.mode}
          trainingTypes={trainingTypes}
          trainers={trainers}
          onClose={() => {
            setActivityModal({ open: false, date: null, activity: null, activities: [], mode: 'add' })
            setGhostDates([])
            setGhostTypeId(null)
          }}
          onSaved={handleActivitySaved}
          onPreviewDates={handlePreviewDates}
        />
      )}

      {/* Training Type Modal */}
      {typeModal.open && (
        <TrainingTypeModal
          type={typeModal.type}
          trainers={trainers}
          onClose={() => setTypeModal({ open: false, type: null })}
          onSaved={handleTypeSaved}
        />
      )}

      {/* Bottom Sheet (Mobile) */}
      {bottomSheet.open && isMobile && (
        <BottomSheet
          date={bottomSheet.date}
          activities={bottomSheet.activities}
          trainingTypes={trainingTypes}
          onClose={() => setBottomSheet({ open: false, date: null, activities: [] })}
          onAction={handleBottomSheetAction}
        />
      )}

      {/* Paste Week Confirm Dialog */}
      {pasteConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste Week?</h3>
            <p className="text-gray-600 mb-4">
              Paste {pasteConfirmDialog.activityCount} activities from week {pasteConfirmDialog.sourceWeek} to week {pasteConfirmDialog.targetWeek}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPasteConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPasteWeek}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Paste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
