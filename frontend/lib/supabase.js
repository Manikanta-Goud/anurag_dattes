import { createClient } from '@supabase/supabase-js'

// ⚠️ SECURITY: Never hardcode credentials! Always use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Missing required Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY!')
}

const safeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeAnonKey = supabaseAnonKey || 'placeholder_anon_key'

export const supabase = createClient(safeUrl, safeAnonKey)

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(safeUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

