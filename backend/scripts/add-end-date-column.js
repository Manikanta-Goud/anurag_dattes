require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addEndDateColumn() {
  try {
    console.log('Testing if end_date column exists...')
    
    // Try to select end_date
    const { data, error } = await supabase
      .from('events')
      .select('end_date')
      .limit(1)
    
    if (error && error.message.includes('column')) {
      console.log('❌ Column end_date does not exist')
      console.log('\n📝 Please run this SQL in Supabase SQL Editor:\n')
      console.log('ALTER TABLE events ADD COLUMN end_date DATE;')
      console.log('\n')
    } else {
      console.log('✅ Column end_date already exists!')
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

addEndDateColumn()
