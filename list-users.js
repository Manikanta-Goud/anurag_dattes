const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA4NTYsImV4cCI6MjA3Njk3Njg1Nn0.kePxSVM8MHCDA2AhpB48vh3apkEQbpiyk83GLblHD9c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listUsers() {
  try {
    console.log('📋 Fetching all users...\n')
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .order('createdAt', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} users:\n`)
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name || 'No name'}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   ID: ${user.id}\n`)
      })
    } else {
      console.log('❌ No users found in database')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listUsers()
