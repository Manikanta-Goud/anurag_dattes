// AUTHENTICATION HELPERS
// Secure authentication utilities
import bcrypt from 'bcrypt'
import { supabaseAdmin } from './supabase'

const SALT_ROUNDS = 12

/**
 * Hash a password securely using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false
  }
  return await bcrypt.compare(password, hash)
}

/**
 * Validate College ID format
 * Format: YYegDDDSRR@anurag.edu.in
 * Example: 23eg105j13@anurag.edu.in
 */
export function validateCollegeId(email) {
  if (!email.endsWith('@anurag.edu.in')) {
    return {
      valid: false,
      message: 'Please use your college ID: id@anurag.edu.in',
    }
  }

  const idPart = email.split('@')[0]
  const collegeIdPattern = /^(\d{2})(eg)(\d{3})([a-z])(\d{2})$/i

  if (!collegeIdPattern.test(idPart)) {
    return {
      valid: false,
      message: 'Invalid College ID format! Format: YYegDDDSRR@anurag.edu.in (e.g., 23eg105j13@anurag.edu.in)',
    }
  }

  return { valid: true }
}

/**
 * Extract user metadata from college email
 */
export function extractUserMetadata(email) {
  const rollNumber = email.split('@')[0]
  
  // Extract branch from roll number
  const branchMatch = rollNumber.match(/\d{2}([a-z]{2})\d{3}/i)
  const branch = branchMatch ? branchMatch[1].toUpperCase() : 'UNKNOWN'
  
  // Extract year from roll number
  const yearPrefix = parseInt(rollNumber.substring(0, 2))
  const currentYear = new Date().getFullYear() % 100
  const yearDiff = currentYear - yearPrefix
  
  let year
  if (yearDiff === 0) year = 1
  else if (yearDiff === 1) year = 2
  else if (yearDiff === 2) year = 3
  else if (yearDiff === 3) year = 4
  else year = 1

  return { rollNumber, branch, year }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_admin, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.is_admin === true || data?.role === 'admin'
  } catch (error) {
    console.error('Error in isUserAdmin:', error)
    return false
  }
}

/**
 * Check if user is banned
 */
export async function isUserBanned(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('banned_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking ban status:', error)
      return false
    }

    if (!data) return false

    // Check if ban is permanent or still active
    if (data.is_permanent) return true
    
    if (data.banned_until) {
      return new Date(data.banned_until) > new Date()
    }

    return false
  } catch (error) {
    console.error('Error in isUserBanned:', error)
    return false
  }
}

/**
 * Get user warnings count
 */
export async function getUserWarningsCount(userId) {
  try {
    const { count, error } = await supabaseAdmin
      .from('warnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting warnings count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUserWarningsCount:', error)
    return 0
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32) {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}
