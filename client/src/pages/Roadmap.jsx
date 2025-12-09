import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { LoadingSpinner } from '../components/common'
import { RoadmapTimeline, RoadmapHeader, ActivityDetail } from '../components/roadmap'

export default function Roadmap() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { year: urlYear } = useParams()
  
  // Year from URL or default to current year
  const [year, setYear] = useState(() => {
    const parsedYear = parseInt(urlYear)
    return isNaN(parsedYear) ? new Date().getFullYear() : parsedYear
  })
  
  const [roadmapData, setRoadmapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('type') // 'type' | 'trainer'
  const [selectedActivity, setSelectedActivity] = useState(null)
  
  // Sync URL with year
  useEffect(() => {
    navigate(`/roadmap/${year}`, { replace: true })
  }, [year, navigate])
  
  // Update year if URL changes
  useEffect(() => {
    const parsedYear = parseInt(urlYear)
    if (!isNaN(parsedYear) && parsedYear !== year) {
      setYear(parsedYear)
    }
  }, [urlYear])
  
  // Load roadmap data
  const loadRoadmap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.activities.getRoadmap(year)
      setRoadmapData(data)
    } catch (err) {
      console.error('Failed to load roadmap:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [year])
  
  useEffect(() => {
    loadRoadmap()
  }, [loadRoadmap])
  
  // Handle year change
  function handleYearChange(newYear) {
    setYear(newYear)
  }
  
  // Handle activity click for details
  function handleActivityClick(activity, rowData) {
    setSelectedActivity({ activity, rowData })
  }
  
  // Get data based on view mode
  const timelineData = viewMode === 'type' 
    ? roadmapData?.byType || []
    : roadmapData?.byTrainer || []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                to={`/dashboard/${year}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Aktivitetsveikart {year}
                </h1>
                <p className="text-sm text-gray-500">
                  Oversikt over alle aktiviteter gjennom året
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Year selector */}
              <select
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              
              <span className="text-sm text-gray-600 hidden md:inline">{user?.name}</span>
              {user?.avatar_url && (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              )}
            </div>
          </div>
          
          {/* View mode tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setViewMode('type')}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${viewMode === 'type' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Etter aktivitetstype
            </button>
            <button
              onClick={() => setViewMode('trainer')}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${viewMode === 'trainer' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Etter trener
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              Feil ved lasting av veikart: {error}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <RoadmapHeader 
                periods={roadmapData?.periods || []}
                totalWeeks={roadmapData?.totalWeeks || 52}
              />
              <RoadmapTimeline
                data={timelineData}
                periods={roadmapData?.periods || []}
                totalWeeks={roadmapData?.totalWeeks || 52}
                viewMode={viewMode}
                onActivityClick={handleActivityClick}
              />
            </div>
          )}
        </div>
      </main>

      {/* Activity detail modal */}
      {selectedActivity && (
        <ActivityDetail
          activity={selectedActivity.activity}
          rowData={selectedActivity.rowData}
          viewMode={viewMode}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  )
}
