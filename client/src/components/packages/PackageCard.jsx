/**
 * PackageCard - Beautiful card component for displaying a training package
 */

export default function PackageCard({ package: pkg, isAdmin, onEdit, onDelete }) {
  const isFree = pkg.price === 0
  
  return (
    <div className={`
      relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden
      transition-all duration-300 hover:shadow-lg hover:-translate-y-1
      ${pkg.is_featured ? 'ring-2 ring-teal-500' : ''}
    `}>
      {/* Featured badge */}
      {pkg.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Anbefalt
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className={`
        px-6 py-5 
        ${isFree 
          ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
        }
      `}>
        <h3 className={`text-xl font-bold ${isFree ? 'text-white' : 'text-slate-800'}`}>
          {pkg.name}
        </h3>
        {pkg.period && (
          <p className={`text-sm mt-1 ${isFree ? 'text-teal-100' : 'text-slate-500'}`}>
            {pkg.period}
          </p>
        )}
      </div>
      
      {/* Price */}
      <div className="px-6 py-4 border-b border-slate-100">
        {isFree ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-teal-600">Gratis</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">{pkg.price}</span>
            <span className="text-lg text-slate-500">kr</span>
          </div>
        )}
      </div>
      
      {/* Description */}
      {pkg.description && (
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-slate-600 text-sm leading-relaxed">
            {pkg.description}
          </p>
        </div>
      )}
      
      {/* Trainers */}
      {pkg.trainers && pkg.trainers.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-slate-600">
              Trener: <span className="font-medium text-slate-800">{pkg.trainers.map(t => t.name).join(', ')}</span>
            </span>
          </div>
        </div>
      )}
      
      {/* Training types */}
      {pkg.training_types && pkg.training_types.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {pkg.training_types.map(type => (
              <span 
                key={type.id}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${type.color}15`,
                  color: type.color
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                {type.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Perks */}
      {pkg.perks && pkg.perks.length > 0 && (
        <div className="px-6 py-4">
          <ul className="space-y-2.5">
            {pkg.perks.map((perk, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-600">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Requirements */}
      {pkg.requirements && pkg.requirements.length > 0 && (
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
            Krav
          </p>
          <ul className="space-y-1.5">
            {pkg.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Admin actions */}
      {isAdmin && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Rediger
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Slett
          </button>
        </div>
      )}
    </div>
  )
}
