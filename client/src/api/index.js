const BASE_URL = '/api'

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  auth: {
    me: () => fetchApi('/auth/me'),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
    devLogin: (role) => fetchApi('/auth/dev-login', { 
      method: 'POST', 
      body: JSON.stringify({ role }) 
    })
  },

  users: {
    list: () => fetchApi('/users'),
    updateRole: (id, role) => fetchApi(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    }),
    delete: (id) => fetchApi(`/users/${id}`, { method: 'DELETE' })
  },

  trainers: {
    list: () => fetchApi('/trainers'),
    get: (id) => fetchApi(`/trainers/${id}`),
    create: (data) => fetchApi('/trainers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => fetchApi(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => fetchApi(`/trainers/${id}`, { method: 'DELETE' }),
    linkUser: (trainerId, userId) => fetchApi(`/trainers/${trainerId}/link`, {
      method: 'PATCH',
      body: JSON.stringify({ user_id: userId })
    })
  },

  types: {
    list: () => fetchApi('/types'),
    get: (id) => fetchApi(`/types/${id}`),
    create: (data) => fetchApi('/types', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => fetchApi(`/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => fetchApi(`/types/${id}`, { method: 'DELETE' })
  },

  activities: {
    getByYear: (year) => fetchApi(`/activities/year/${year}`),
    getByDate: (date) => fetchApi(`/activities/date/${date}`),
    getRoadmap: (year) => fetchApi(`/activities/roadmap/${year}`),
    create: (data) => fetchApi('/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    createRecurring: (data) => fetchApi('/activities/recurring', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    createBulk: (activities) => fetchApi('/activities/bulk', {
      method: 'POST',
      body: JSON.stringify({ activities })
    }),
    update: (id, data) => fetchApi(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => fetchApi(`/activities/${id}`, { method: 'DELETE' }),
    deleteSeries: (seriesId) => fetchApi(`/activities/series/${seriesId}`, { method: 'DELETE' }),
    getBudget: (year) => fetchApi(`/activities/budget/${year}`)
  },

  budget: {
    // Budget settings
    get: (year) => fetchApi(`/budget/${year}`),
    set: (year, data) => fetchApi(`/budget/${year}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
    // Full budget report
    getReport: (year) => fetchApi(`/budget/${year}/report`),
    
    // Sections
    getSections: (year) => fetchApi(`/budget/${year}/sections`),
    createSection: (year, data) => fetchApi(`/budget/${year}/sections`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateSection: (id, data) => fetchApi(`/budget/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteSection: (id, deleteCosts = false) => 
      fetchApi(`/budget/sections/${id}?deleteCosts=${deleteCosts}`, { method: 'DELETE' }),
    
    // Manual costs
    getCosts: (year) => fetchApi(`/budget/${year}/costs`),
    createCost: (data) => fetchApi('/budget/costs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    createCostsBulk: (costs) => fetchApi('/budget/costs/bulk', {
      method: 'POST',
      body: JSON.stringify({ costs })
    }),
    updateCost: (id, data) => fetchApi(`/budget/costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteCost: (id) => fetchApi(`/budget/costs/${id}`, { method: 'DELETE' }),
    
    // Income
    addIncome: (data) => fetchApi('/budget/income', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateIncome: (id, data) => fetchApi(`/budget/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteIncome: (id) => fetchApi(`/budget/income/${id}`, { method: 'DELETE' })
  },

  notifications: {
    list: (unreadOnly = false) => fetchApi(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
    unreadCount: () => fetchApi('/notifications/unread-count'),
    markRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => fetchApi('/notifications/mark-all-read', { method: 'POST' }),
    delete: (id) => fetchApi(`/notifications/${id}`, { method: 'DELETE' })
  },

  packages: {
    list: () => fetchApi('/packages'),
    get: (id) => fetchApi(`/packages/${id}`),
    create: (data) => fetchApi('/packages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => fetchApi(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => fetchApi(`/packages/${id}`, { method: 'DELETE' }),
    reorder: (order) => fetchApi('/packages/reorder', {
      method: 'POST',
      body: JSON.stringify({ order })
    })
  }
}
