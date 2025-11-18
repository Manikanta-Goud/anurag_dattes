const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA4NTYsImV4cCI6MjA3Njk3Njg1Nn0.kePxSVM8MHCDA2AhpB48vh3apkEQbpiyk83GLblHD9c'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFriendRequests() {
  try {
    console.log('🔍 Checking friend_requests table...\n')
    
    // Get all friend requests
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching requests:', error)
      return
    }
    
    if (requests && requests.length > 0) {
      console.log(`✅ Found ${requests.length} recent friend requests:\n`)
      
      for (const req of requests) {
        // Get sender profile
        const { data: sender } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', req.sender_id)
          .single()
        
        // Get receiver profile
        const { data: receiver } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', req.receiver_id)
          .single()
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`From: ${sender?.name || 'Unknown'} (${sender?.email || 'N/A'})`)
        console.log(`To:   ${receiver?.name || 'Unknown'} (${receiver?.email || 'N/A'})`)
        console.log(`Status: ${req.status}`)
        console.log(`Created: ${new Date(req.created_at).toLocaleString()}`)
        console.log(`Request ID: ${req.id}\n`)
      }
    } else {
      console.log('❌ No friend requests found in database')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkFriendRequests()
