import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../database.json')

// Default database structure
const defaultData = {
  users: [],
  trainers: [],
  training_types: [],
  recurring_series: [],
  activities: [],
  notifications: [],
  budgets: [],
  income_entries: [],
  packages: []
}

// Create adapter and db instance
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, defaultData)

export async function initDatabase() {
  await db.read()
  
  // Initialize with default data if empty
  if (!db.data) {
    db.data = defaultData
  }
  
  // Ensure all collections exist
  db.data.users = db.data.users || []
  db.data.trainers = db.data.trainers || []
  db.data.training_types = db.data.training_types || []
  db.data.recurring_series = db.data.recurring_series || []
  db.data.activities = db.data.activities || []
  db.data.notifications = db.data.notifications || []
  db.data.budgets = db.data.budgets || []
  db.data.income_entries = db.data.income_entries || []
  db.data.packages = db.data.packages || []
  
  await db.write()
  console.log('Database initialized successfully')
}

// Helper functions
export function generateId() {
  return uuidv4()
}

export function getCurrentTimestamp() {
  return new Date().toISOString()
}

export default db
