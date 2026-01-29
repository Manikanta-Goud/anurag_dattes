require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function makeFriends() {
  try {
    console.log('🔍 Looking up users...')
    
    // Find user 1
    const { data: user1Data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', '23eg105j13@anurag.edu.in')
      .single()
    
    // Find user 2
    const { data: user2Data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', '23eg105j11@anurag.edu.in')
      .single()
    
    if (!user1Data || !user2Data) {
      console.log('❌ Could not find one or both users')
      console.log('User 1 (23eg105j13):', user1Data ? '✅ Found' : '❌ Not found')
      console.log('User 2 (23eg105j11):', user2Data ? '✅ Found' : '❌ Not found')
      return
    }
    
    console.log('✅ Found User 1:', user1Data.name, `(${user1Data.id})`)
    console.log('✅ Found User 2:', user2Data.name, `(${user2Data.id})`)
    
    // Check if already matched
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1Id.eq.${user1Data.id},user2Id.eq.${user2Data.id}),and(user1Id.eq.${user2Data.id},user2Id.eq.${user1Data.id})`)
      .single()
    
    if (existingMatch) {
      console.log('✅ Users are already friends!')
      return
    }
    
    // Create match
    console.log('🤝 Creating friendship...')
    const matchId = uuidv4()
    const { data: newMatch, error: matchError } = await supabase
      .from('matches')
      .insert({
        id: matchId,
        user1Id: user1Data.id,
        user2Id: user2Data.id,
        createdAt: new Date().toISOString()
      })
      .select()
    
    if (matchError) {
      console.error('❌ Error creating match:', matchError)
      return
    }
    
    // Update any pending friend requests to accepted
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .or(`and(sender_id.eq.${user1Data.id},receiver_id.eq.${user2Data.id}),and(sender_id.eq.${user2Data.id},receiver_id.eq.${user1Data.id})`)
    
    console.log('🎉 SUCCESS! Users are now friends and can chat!')
    console.log('Match ID:', matchId)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

makeFriends()
