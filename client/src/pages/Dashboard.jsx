import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Sidebar from '../components/Sidebar'
import Calendar from '../components/Calendar'
import ActivityModal from '../components/ActivityModal'
import TrainingTypeModal from '../components/TrainingTypeModal'
import BudgetSummary from '../components/BudgetSummary'

export default function Dashboard() {
  const { user, isAdmin, canEdit } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [activities, setActivities] = useState([])
  const [trainingTypes, setTrainingTypes] = useState([])
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [activityModal, setActivityModal] = useState({ 
    open: false, 
    date: null, 
    activity: null,
    activities: [],
    mode: 'add' // 'add', 'edit', 'list'
  })
  const [typeModal, setTypeModal] = useState({ open: false, type: null })
  const [showBudget, setShowBudget] = useState(false)

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
    
    if (activity) {
      // Clicked on specific activity - edit mode
      setActivityModal({ 
        open: true, 
        date, 
        activity,
        activities: dayActivities.length > 0 ? dayActivities : activities.filter(a => a.date === date),
        mode: 'edit'
      })
    } else if (dayActivities.length > 0) {
      // Has activities on this day - show list
      setActivityModal({ 
        open: true, 
        date, 
        activity: null,
        activities: dayActivities,
        mode: 'list'
      })
    } else {
      // No activities - add new
      setActivityModal({ 
        open: true, 
        date, 
        activity: null,
        activities: [],
        mode: 'add'
      })
    }
  }

  // Handle add activity (from right-click menu)
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

  function handleActivitySaved() {
    setActivityModal({ open: false, date: null, activity: null, activities: [], mode: 'add' })
    loadData()
  }

  function handleTypeSaved() {
    setTypeModal({ open: false, type: null })
    loadData()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        year={year}
        onYearChange={setYear}
        trainingTypes={trainingTypes}
        onAddType={() => setTypeModal({ open: true, type: null })}
        onEditType={(type) => setTypeModal({ open: true, type })}
        onShowBudget={() => setShowBudget(true)}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sports Calendar {year}</h1>
            <p className="text-sm text-gray-500">
              {user?.role === 'admin' && 'Administrator'}
              {user?.role === 'trainer' && 'Trainer'}
              {user?.role === 'user' && 'Viewer'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            )}
          </div>
        </header>

        {/* Calendar */}
        <div className="p-4 overflow-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <Calendar
              year={year}
              activities={activities}
              trainingTypes={trainingTypes}
              onCellClick={handleCellClick}
              onAddActivity={handleAddActivity}
              canEdit={canEdit}
            />
          )}
        </div>
      </main>

      {/* Activity Modal */}
      {activityModal.open && (
        <ActivityModal
          date={activityModal.date}
          activity={activityModal.activity}
          activities={activityModal.activities}
          initialMode={activityModal.mode}
          trainingTypes={trainingTypes}
          trainers={trainers}
          onClose={() => setActivityModal({ open: false, date: null, activity: null, activities: [], mode: 'add' })}
          onSaved={handleActivitySaved}
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

      {/* Budget Summary */}
      {showBudget && isAdmin && (
        <BudgetSummary
          year={year}
          onClose={() => setShowBudget(false)}
        />
      )}
    </div>
  )
}
