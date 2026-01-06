/**
 * CategorySection - Section wrapper for package categories
 */

export default function CategorySection({ title, subtitle, gradient, children }) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${gradient}`} />
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-slate-500 ml-5 pl-4">{subtitle}</p>
        )}
      </div>
      
      {/* Package cards */}
      {children}
    </section>
  )
}
