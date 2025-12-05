// Formatting utilities

/**
 * Format number as Norwegian Kroner
 * @param {number} value - Amount in NOK
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(value || 0)
}

/**
 * Format number with Norwegian locale
 */
export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('no-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value || 0)
}

/**
 * Format hours (e.g., "2.5t" or "2t")
 */
export function formatHours(hours) {
  if (!hours && hours !== 0) return '-'
  return hours % 1 === 0 ? `${hours}t` : `${hours.toFixed(1)}t`
}

/**
 * Format time string (HH:MM)
 */
export function formatTime(timeStr) {
  if (!timeStr) return '--:--'
  return timeStr
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 50) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

