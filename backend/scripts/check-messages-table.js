// Check messages table structure
import { supabaseAdmin } from './lib/supabase.js'

async function checkMessagesTable() {
  try {
    console.log('🔍 Checking messages table...\n')
    
    // Try to select from messages table
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error querying messages table:', error)
      console.log('\n📋 Error details:')
      console.log('Code:', error.code)
      console.log('Message:', error.message)
      console.log('Details:', error.details)
      console.log('Hint:', error.hint)
      return
    }
    
    console.log('✅ Messages table exists!')
    console.log('\n📊 Sample record (if any):', data)
    
    if (data && data.length > 0) {
      console.log('\n🔑 Column names found:')
      console.log(Object.keys(data[0]))
    } else {
      console.log('\n⚠️ No messages in table yet')
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
  }
}

checkMessagesTable()
