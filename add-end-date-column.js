const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NiwiZXhwIjoyMDc2OTc2ODU2fQ.Sddqm2VkARbAfYDaI7whOw4YQaCkaM6cRSaCUykrU04'

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
