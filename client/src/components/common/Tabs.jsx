/**
 * Tabs component - Tab navigation with panels
 */

import { createContext, useContext, useState } from 'react'

const TabsContext = createContext()

export function Tabs({ 
  children, 
  defaultValue,
  value,
  onChange,
  className = '' 
}) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  
  const activeValue = value !== undefined ? value : internalValue
  const handleChange = onChange || setInternalValue

  return (
    <TabsContext.Provider value={{ activeValue, onChange: handleChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className = '' }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export function Tab({ children, value, className = '' }) {
  const { activeValue, onChange } = useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <button
      onClick={() => onChange(value)}
      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
        ${isActive 
          ? 'border-teal-500 text-teal-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabPanel({ children, value, className = '' }) {
  const { activeValue } = useContext(TabsContext)
  
  if (activeValue !== value) return null

  return (
    <div className={className}>
      {children}
    </div>
  )
}
