import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA4NTYsImV4cCI6MjA3Njk3Njg1Nn0.kePxSVM8MHCDA2AhpB48vh3apkEQbpiyk83GLblHD9c'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NiwiZXhwIjoyMDc2OTc2ODU2fQ.Sddqm2VkARbAfYDaI7whOw4YQaCkaM6cRSaCUykrU04'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

