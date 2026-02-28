import { z } from 'zod'

// College ID Regex Pattern
// Format: YYegDDDSRR@anurag.edu.in (e.g., 23eg105j13@anurag.edu.in)
const collegeIdPattern = /^(\d{2})(eg)(\d{3})([a-z])(\d{2})$/i

export const signupSchema = z.object({
    email: z
        .string()
        .email('Invalid email address')
        .min(1, 'Email is required')
        .refine((email) => email.endsWith('@anurag.edu.in'), {
            message: 'Please use your college ID: id@anurag.edu.in',
        })
        .refine((email) => {
            const idPart = email.split('@')[0]
            return collegeIdPattern.test(idPart)
        }, {
            message: 'Invalid College ID format! Format: YYegDDDSRR@anurag.edu.in',
        }),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'), // basic strong password
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
})

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email address')
        .refine((email) => email.endsWith('@anurag.edu.in'), {
            message: 'Please use your college ID: id@anurag.edu.in',
        }),
    password: z.string().min(1, 'Password is required'),
})

// Valid departments at Anurag University
const VALID_DEPARTMENTS = [
    'CSE', 'Computer Science', 'Computer Science and Engineering',
    'ECE', 'Electronics and Communication Engineering',
    'EEE', 'Electrical and Electronics Engineering',
    'ME', 'Mechanical Engineering',
    'CE', 'Civil Engineering',
    'IT', 'Information Technology',
    'AI', 'Artificial Intelligence',
    'DS', 'Data Science',
    'CS', 'Cyber Security',
]

export const updateProfileSchema = z.object({
    userId: z.string().uuid().optional(),
    name: z.string().min(2).max(50).optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    age: z.number().int().min(16).max(100).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    location: z.string().max(100).optional(),
    // Social media URLs - optional, will be validated server-side if provided
    instagram: z.string().optional().or(z.literal('')),
    github: z.string().optional().or(z.literal('')),
    linkedin: z.string().optional().or(z.literal('')),
    interests: z.array(z.string()).optional(),
    hobbies: z.array(z.string()).optional(),
    // Department and Year are now REQUIRED
    department: z.string()
        .min(2, 'Department is required')
        .max(50, 'Department must be less than 50 characters')
        .refine((val) => {
            const upper = val.toUpperCase().trim()
            // Reject 'EG' specifically
            if (upper === 'EG') {
                return false
            }
            // Reject 'UNKNOWN' or empty values
            if (upper === 'UNKNOWN' || upper === '') {
                return false
            }
            return true
        }, {
            message: 'Invalid department! "EG" is not a valid department. Please enter your actual branch (e.g., CSE, ECE, ME, EEE, IT)',
        }),
    year: z.number().int().min(1, 'Year must be between 1 and 5').max(5, 'Year must be between 1 and 5'),
    photo_url: z.string().optional(),
    profile_picture: z.string().optional(),
})

// Helper function to validate social media URLs (to be used server-side)
export function validateSocialMediaUrl(url, platform) {
    if (!url || url === '') return { valid: true }

    try {
        // First check if it's a valid URL format
        new URL(url)

        // Check platform-specific domain
        const lowerUrl = url.toLowerCase()

        if (platform === 'instagram') {
            if (!lowerUrl.includes('instagram.com/')) {
                return { valid: false, error: 'Instagram link is not valid. Please enter a valid Instagram profile URL (e.g., https://www.instagram.com/username/)' }
            }
            // Extract username from Instagram URL
            const usernameMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/)
            if (!usernameMatch || usernameMatch[1].length < 1) {
                return { valid: false, error: 'Instagram username is not valid in the URL' }
            }
        } else if (platform === 'github') {
            if (!lowerUrl.includes('github.com/')) {
                return { valid: false, error: 'GitHub link is not valid. Please enter a valid GitHub profile URL (e.g., https://github.com/username)' }
            }
            // Extract username from GitHub URL
            const usernameMatch = url.match(/github\.com\/([a-zA-Z0-9_-]+)/)
            if (!usernameMatch || usernameMatch[1].length < 1) {
                return { valid: false, error: 'GitHub username is not valid in the URL' }
            }
        } else if (platform === 'linkedin') {
            if (!lowerUrl.includes('linkedin.com/in/')) {
                return { valid: false, error: 'LinkedIn link is not valid. Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/)' }
            }
            // Extract username from LinkedIn URL
            const usernameMatch = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)
            if (!usernameMatch || usernameMatch[1].length < 1) {
                return { valid: false, error: 'LinkedIn username is not valid in the URL' }
            }
        }

        return { valid: true }
    } catch (e) {
        return { valid: false, error: `${platform.charAt(0).toUpperCase() + platform.slice(1)} URL format is invalid` }
    }
}
