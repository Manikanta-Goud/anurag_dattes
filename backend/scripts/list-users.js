require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

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
