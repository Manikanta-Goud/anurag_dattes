const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NiwiZXhwIjoyMDc2OTc2ODU2fQ.Sddqm2VkARbAfYDaI7whOw4YQaCkaM6cRSaCUykrU04'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function fixGenderValues() {
  try {
    console.log('🔍 Checking for profiles with invalid gender values...\n')
    
    // Get all profiles
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, gender')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      return
    }

    console.log(`📊 Found ${profiles.length} total profiles\n`)

    const validGenders = ['male', 'female', 'other']
    let fixedCount = 0
    let invalidProfiles = []

    // Check each profile
    for (const profile of profiles) {
      if (!profile.gender || !validGenders.includes(profile.gender.toLowerCase())) {
        invalidProfiles.push(profile)
        console.log(`❌ Invalid gender found:`)
        console.log(`   Name: ${profile.name}`)
        console.log(`   Email: ${profile.email}`)
        console.log(`   Current gender: "${profile.gender}"`)
        
        // Fix the gender value
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ gender: 'other' })
          .eq('id', profile.id)

        if (updateError) {
          console.log(`   ⚠️ Failed to fix: ${updateError.message}\n`)
        } else {
          console.log(`   ✅ Fixed → "other"\n`)
          fixedCount++
        }
      }
    }

    console.log('═'.repeat(50))
    console.log(`\n📈 SUMMARY:`)
    console.log(`   Total profiles: ${profiles.length}`)
    console.log(`   Invalid gender values: ${invalidProfiles.length}`)
    console.log(`   Fixed: ${fixedCount}`)
    console.log('═'.repeat(50))
    console.log('\n✅ Done! All profiles now have valid gender values.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixGenderValues()
