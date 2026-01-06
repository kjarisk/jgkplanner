import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { LoadingSpinner } from '../components/common'
import { PackageCard, PackageModal, CategorySection } from '../components/packages'

const CATEGORY_INFO = {
  junior: {
    title: 'Junior',
    subtitle: 'Treningspakker for unge spillere',
    icon: '🏌️',
    color: 'from-emerald-500 to-teal-600'
  },
  voksen: {
    title: 'Voksen',
    subtitle: 'Treningspakker for voksne spillere',
    icon: '⛳',
    color: 'from-slate-600 to-slate-800'
  },
  alle: {
    title: 'For Alle',
    subtitle: 'Pakker tilgjengelig for alle aldersgrupper',
    icon: '🎯',
    color: 'from-amber-500 to-orange-600'
  },
  gratis: {
    title: 'Gratis Tilbud',
    subtitle: 'Gratis trening for alle',
    icon: '🌟',
    color: 'from-teal-500 to-cyan-600'
  }
}

const CATEGORY_ORDER = ['junior', 'voksen', 'alle', 'gratis']

export default function Packages() {
  const { user, isAdmin } = useAuth()
  const [packages, setPackages] = useState([])
  const [trainers, setTrainers] = useState([])
  const [trainingTypes, setTrainingTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editModal, setEditModal] = useState({ open: false, package: null })

  // Load packages and supporting data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [packagesData, trainersData, typesData] = await Promise.all([
        api.packages.list(),
        api.trainers.list(),
        api.types.list()
      ])
      setPackages(packagesData)
      setTrainers(trainersData)
      setTrainingTypes(typesData)
    } catch (err) {
      console.error('Failed to load packages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Group packages by category
  const packagesByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = packages.filter(p => p.category === category)
    return acc
  }, {})

  // Handle package save
  async function handleSave(packageData) {
    try {
      if (editModal.package) {
        await api.packages.update(editModal.package.id, packageData)
      } else {
        await api.packages.create(packageData)
      }
      setEditModal({ open: false, package: null })
      loadData()
    } catch (err) {
      console.error('Failed to save package:', err)
      throw err
    }
  }

  // Handle package delete
  async function handleDelete(packageId) {
    if (!confirm('Er du sikker på at du vil slette denne pakken?')) return
    try {
      await api.packages.delete(packageId)
      loadData()
    } catch (err) {
      console.error('Failed to delete package:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm">Tilbake til kalender</span>
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Treningspakker
              </h1>
              <p className="text-slate-300 text-lg">
                Velg pakken som passer best for deg
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setEditModal({ open: true, package: null })}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ny pakke
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
            <p className="font-medium">Feil ved lasting av pakker</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Prøv igjen
            </button>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Ingen pakker ennå</h3>
            <p className="text-slate-500 mb-6">Det er ingen treningspakker tilgjengelig for øyeblikket.</p>
            {isAdmin && (
              <button
                onClick={() => setEditModal({ open: true, package: null })}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Opprett første pakke
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {CATEGORY_ORDER.map(category => {
              const categoryPackages = packagesByCategory[category]
              if (categoryPackages.length === 0) return null
              
              const info = CATEGORY_INFO[category]
              
              return (
                <CategorySection
                  key={category}
                  title={info.title}
                  subtitle={info.subtitle}
                  gradient={info.color}
                >
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryPackages.map(pkg => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        isAdmin={isAdmin}
                        onEdit={() => setEditModal({ open: true, package: pkg })}
                        onDelete={() => handleDelete(pkg.id)}
                      />
                    ))}
                  </div>
                </CategorySection>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-sm">
            Kontakt oss for mer informasjon om våre treningspakker
          </p>
          <p className="text-xs mt-2 text-slate-500">
            JGK Planner © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Edit Modal */}
      {editModal.open && (
        <PackageModal
          package={editModal.package}
          trainers={trainers}
          trainingTypes={trainingTypes}
          onClose={() => setEditModal({ open: false, package: null })}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
