// INPUT VALIDATION SCHEMAS
// Using Zod for type-safe validation
import { z } from 'zod'

// User Signup Validation
export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .endsWith('@anurag.edu.in', 'Must use college email (@anurag.edu.in)')
    .regex(
      /^\d{2}eg\d{3}[a-z]\d{2}@anurag\.edu\.in$/i,
      'Invalid college ID format. Use: YYegDDDSRR@anurag.edu.in'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
})

// User Login Validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Profile Update Validation
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  club_name: z.string().max(100, 'Club name must be less than 100 characters').optional(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

// Social Links Validation
export const socialLinksSchema = z.object({
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
})

// Message Validation
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 characters)'),
  receiver_id: z.string().uuid('Invalid receiver ID'),
})

// Achievement Validation
export const achievementSchema = z.object({
  student_name: z
    .string()
    .min(2, 'Student name must be at least 2 characters')
    .max(100, 'Student name too long'),
  achievement_title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description too long'),
  achievement_date: z.string().datetime('Invalid date format'),
  sector: z.enum([
    'Technical',
    'Sports',
    'Cultural',
    'Academic',
    'Social Service',
    'Other',
  ]),
  achievement_type: z
    .enum(['Competition', 'Certification', 'Award', 'Publication', 'Other'])
    .optional(),
  position: z.string().max(50, 'Position too long').optional(),
  organization: z.string().max(200, 'Organization name too long').optional(),
  image_url: z.string().url('Invalid image URL').optional(),
})

// Event Validation
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description too long'),
  event_date: z.string().datetime('Invalid date format'),
  end_date: z.string().datetime('Invalid end date format').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  organizer: z.string().max(100, 'Organizer name too long').optional(),
  category: z.enum([
    'Technical',
    'Sports',
    'Cultural',
    'Academic',
    'Workshop',
    'Seminar',
    'Other',
  ]),
  max_participants: z.number().int().positive().optional(),
  registration_required: z.boolean().optional(),
})

// Warning Validation
export const warningSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  issued_by: z.string().uuid('Invalid issuer ID'),
})

// Ban User Validation
export const banUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long'),
  banned_until: z.string().datetime('Invalid date format').optional(),
  is_permanent: z.boolean().default(false),
  banned_by: z.string().uuid('Invalid admin ID'),
})

// Friend Request Validation
export const friendRequestSchema = z.object({
  receiver_id: z.string().uuid('Invalid receiver ID'),
})

// Search Query Validation
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100, 'Query too long'),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})

// File Upload Validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z
    .array(z.string())
    .default(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
})

/**
 * Validate file upload
 */
export function validateFileUpload(file, maxSize = 5 * 1024 * 1024) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255) // Limit length
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page = 1, limit = 20) {
  const validPage = Math.max(1, parseInt(page) || 1)
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const offset = (validPage - 1) * validLimit

  return { page: validPage, limit: validLimit, offset }
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL
 */
export function isValidURL(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
