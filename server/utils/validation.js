import { z } from 'zod'

// Common schemas
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional().nullable()
export const uuidSchema = z.string().uuid('Invalid ID format')
export const yearSchema = z.coerce.number().int().min(2020).max(2050)

// Activity schemas
export const createActivitySchema = z.object({
  date: dateSchema,
  training_type_id: z.string().min(1, 'Training type is required'),
  trainer_id: z.string().optional().nullable(),
  hours: z.coerce.number().positive().optional().nullable(),
  start_time: timeSchema,
  notes: z.string().max(500).optional().nullable()
})

export const updateActivitySchema = z.object({
  trainer_id: z.string().optional().nullable(),
  hours: z.coerce.number().positive().optional().nullable(),
  start_time: timeSchema,
  notes: z.string().max(500).optional().nullable()
})

export const createRecurringSchema = z.object({
  training_type_id: z.string().min(1, 'Training type is required'),
  trainer_id: z.string().optional().nullable(),
  hours: z.coerce.number().positive().optional().nullable(),
  start_time: timeSchema,
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, 'At least one weekday is required'),
  start_date: dateSchema,
  end_date: dateSchema.optional().nullable()
})

// Trainer schemas
export const createTrainerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  hourly_cost: z.coerce.number().nonnegative().default(0),
  user_id: z.string().uuid().optional().nullable()
})

export const updateTrainerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  hourly_cost: z.coerce.number().nonnegative().optional(),
  user_id: z.string().uuid().optional().nullable()
})

// Training type schemas
export const createTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6'),
  default_trainer_id: z.string().optional().nullable(),
  default_hours: z.coerce.number().positive().default(1)
})

export const updateTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  default_trainer_id: z.string().optional().nullable(),
  default_hours: z.coerce.number().positive().optional()
})

// Budget schemas
export const setBudgetSchema = z.object({
  planned_budget: z.coerce.number().nonnegative('Budget must be non-negative')
})

export const createIncomeSchema = z.object({
  year: yearSchema,
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().max(200).optional().default(''),
  activity_id: z.string().uuid().optional().nullable(),
  date: dateSchema
})

export const updateIncomeSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  description: z.string().max(200).optional(),
  activity_id: z.string().uuid().optional().nullable(),
  date: dateSchema.optional()
})

// User role schema
export const updateRoleSchema = z.object({
  role: z.enum(['user', 'trainer', 'admin'], { 
    errorMap: () => ({ message: 'Role must be user, trainer, or admin' })
  })
})

/**
 * Express middleware to validate request body with Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body)
      if (!result.success) {
        const errors = result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        })
      }
      req.body = result.data // Use parsed/transformed data
      next()
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request data' })
    }
  }
}

/**
 * Express middleware to validate request params
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params)
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid parameters',
          details: result.error.errors 
        })
      }
      req.params = result.data
      next()
    } catch (error) {
      return res.status(400).json({ error: 'Invalid parameters' })
    }
  }
}

