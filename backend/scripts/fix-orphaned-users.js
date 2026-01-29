// Fix orphaned auth users (users in auth.users but not in profiles table)
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixOrphanedUsers() {
  try {
    console.log('🔍 Checking for orphaned auth users...')
    
    // Get all auth users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }
    
    console.log(`📊 Found ${users.length} auth users\n`)
    
    let orphanedCount = 0
    let fixedCount = 0
    
    // Check each user for a matching profile
    for (const user of users) {
      console.log(`Checking: ${user.email}`)
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, branch, year')
        .eq('id', user.id)
        .single()
      
      if (!profile || profileError) {
        orphanedCount++
        console.log(`   ⚠️  NO PROFILE FOUND - Creating...`)
        
        // Extract data from email
        const email = user.email
        const rollNumber = email.split('@')[0]
        const branchMatch = rollNumber.match(/\d{2}([a-z]{2})\d{3}/i)
        const branch = branchMatch ? branchMatch[1].toUpperCase() : 'UNKNOWN'
        const yearPrefix = parseInt(rollNumber.substring(0, 2))
        const currentYear = new Date().getFullYear() % 100
        const yearDiff = currentYear - yearPrefix
        const academicYear = yearDiff >= 0 && yearDiff <= 4 ? yearDiff + 1 : 1
        
        // Create profile
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([{
            id: user.id,
            auth_id: user.id,
            email: email,
            name: user.user_metadata?.name || 'User',
            roll_number: rollNumber,
            branch: branch,
            year: academicYear,
            gender: 'prefer_not_to_say',
            age: 18,
            is_verified: false,
            is_active: true
          }])
          .select()
          .single()
        
        if (createError) {
          console.log(`   ❌ Failed to create profile: ${createError.message}`)
        } else {
          fixedCount++
          console.log(`   ✅ Profile created successfully!`)
          console.log(`      Name: ${newProfile.name}`)
          console.log(`      Branch: ${newProfile.branch}`)
          console.log(`      Year: ${newProfile.year}\n`)
        }
      } else {
        console.log(`   ✅ Profile exists (${profile.name})\n`)
      }
    }
    
    console.log('═'.repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   Total auth users: ${users.length}`)
    console.log(`   Orphaned users: ${orphanedCount}`)
    console.log(`   Fixed: ${fixedCount}`)
    console.log('═'.repeat(50))
    console.log('\n✅ Done!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixOrphanedUsers()
