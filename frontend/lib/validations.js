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

export const updateProfileSchema = z.object({
    userId: z.string().uuid().optional(), // Ideally required, but sometimes implied
    name: z.string().min(2).max(50).optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    age: z.number().int().min(16).max(100).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    location: z.string().max(100).optional(),
    instagram: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    interests: z.array(z.string()).optional(),
    hobbies: z.array(z.string()).optional(),
    department: z.string().optional(),
    year: z.number().int().min(1).max(5).optional(),
    photo_url: z.string().url().optional(),
    profile_picture: z.string().url().optional(),
})
