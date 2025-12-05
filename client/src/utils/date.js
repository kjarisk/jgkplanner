// Date utilities - reusable across components

export const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
]

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'
]

export const WEEKDAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

export const WEEKDAYS_FULL = [
  'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'
]

/**
 * Format date string to Norwegian locale
 * @param {string} dateStr - Date string (YYYY-MM-DD or ISO format)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, options = {}) {
  const defaultOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return new Date(dateStr).toLocaleDateString('no-NO', { ...defaultOptions, ...options })
}

/**
 * Format date for short display (e.g., "man. 5. jan")
 */
export function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('no-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

/**
 * Format date for table display (e.g., "man. 5. jan.")
 */
export function formatDateCompact(dateStr) {
  const date = new Date(dateStr)
  const dayName = WEEKDAYS[date.getDay()].toLowerCase()
  const day = date.getDate()
  const month = MONTHS_SHORT[date.getMonth()].toLowerCase()
  return `${dayName}. ${day}. ${month}.`
}

/**
 * Get today as YYYY-MM-DD string (local timezone)
 */
export function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Convert date to YYYY-MM-DD format (local timezone)
 */
export function toDateString(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Get ISO week number
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Get first day of month (0=Sunday)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

/**
 * Get start of week (Sunday)
 */
export function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Get array of dates for a week starting from given date
 */
export function getWeekDates(weekStart) {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    dates.push(toDateString(d))
  }
  return dates
}

