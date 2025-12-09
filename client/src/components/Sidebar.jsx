import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ 
  year, 
  onYearChange, 
  trainingTypes, 
  onAddType, 
  onEditType,
  isAdmin,
  canEdit
}) {
  const { logout } = useAuth()
  
  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear - 2; y <= currentYear + 5; y++) {
    years.push(y)
  }

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-teal-400">JGK Planner</h1>
      </div>

      {/* Year Selector */}
      <div className="p-4 border-b border-slate-700">
        <label className="block text-xs text-slate-400 mb-2">Select Year</label>
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Training Types */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">Training Types</h3>
          {canEdit && (
            <button
              onClick={onAddType}
              className="text-teal-400 hover:text-teal-300 text-sm"
            >
              + Add
            </button>
          )}
        </div>
        <div className="space-y-2">
          {trainingTypes.map(type => (
            <div
              key={type.id}
              onClick={() => canEdit && onEditType(type)}
              className={`flex items-center gap-3 p-2 rounded ${canEdit ? 'hover:bg-slate-700 cursor-pointer' : ''}`}
            >
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: type.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{type.name}</p>
                {type.default_trainer_name && (
                  <p className="text-xs text-slate-500 truncate">{type.default_trainer_name}</p>
                )}
              </div>
              <span className="text-xs text-slate-500">{type.default_hours}t</span>
            </div>
          ))}
          {trainingTypes.length === 0 && (
            <p className="text-sm text-slate-500 italic">No training types yet</p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        {isAdmin && (
          <>
            <Link
              to={`/budget/${year}`}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Budsjettrapport
            </Link>
            <Link
              to="/admin"
              className="block w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium text-center transition-colors"
            >
              Admin Panel
            </Link>
          </>
        )}
        <button
          onClick={logout}
          className="w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

