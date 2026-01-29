// SECURED MIDDLEWARE
// This file implements proper authentication and authorization

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from './lib/supabase'

// Define public routes (no authentication required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // API auth endpoints are public
  '/api/auth/(.*)',
])

// Define admin routes (require admin role)
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin/(.*)',
])

// Define protected API routes (require authentication)
const isProtectedApiRoute = createRouteMatcher([
  '/api/(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // ===== ADMIN ROUTE PROTECTION =====
  if (isAdminRoute(request)) {
    try {
      // Require authentication first
      const { userId } = await auth.protect()

      // Check if user is admin in database
      if (supabaseAdmin) {
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('is_admin, role')
          .eq('clerk_user_id', userId)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Verify admin privileges
        if (!user?.is_admin && user?.role !== 'admin') {
          console.warn(`Unauthorized admin access attempt by user: ${userId}`)
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    } catch (error) {
      console.error('Admin authentication error:', error)
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  // ===== API ROUTE PROTECTION =====
  if (isProtectedApiRoute(request) && !isPublicRoute(request)) {
    try {
      // Require authentication for all protected API routes
      await auth.protect()

      // Optional: Check if user is banned
      if (supabaseAdmin && pathname !== '/api/auth/logout') {
        const { userId } = await auth()

        if (userId) {
          const { data: bannedUser } = await supabaseAdmin
            .from('banned_users')
            .select('*')
            .eq('clerk_user_id', userId)
            .single()

          if (bannedUser) {
            // Check if ban is still active
            const isBanned =
              bannedUser.is_permanent ||
              (bannedUser.banned_until && new Date(bannedUser.banned_until) > new Date())

            if (isBanned) {
              return NextResponse.json(
                {
                  error: 'Your account has been banned',
                  reason: bannedUser.reason,
                  bannedUntil: bannedUser.banned_until,
                  isPermanent: bannedUser.is_permanent,
                },
                { status: 403 }
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('API authentication error:', error)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  }

  // ===== GENERAL ROUTE PROTECTION =====
  if (!isPublicRoute(request)) {
    try {
      await auth.protect()
    } catch (error) {
      console.error('Route authentication error:', error)
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Only in production, add HSTS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
