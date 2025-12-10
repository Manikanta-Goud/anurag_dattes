import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { clerkClient } from '@clerk/nextjs/server'

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Map() // userId -> lastSeen timestamp

// Clean up offline users every minute
setInterval(() => {
  const now = Date.now()
  const timeout = 60000 // 1 minute
  for (const [userId, lastSeen] of onlineUsers.entries()) {
    if (now - lastSeen > timeout) {
      onlineUsers.delete(userId)
    }
  }
}, 60000)

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}

// Auth Routes
async function handleSignup(request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate College ID Format
    const validateCollegeId = (email) => {
      if (!email.endsWith('@anurag.edu.in')) {
        return {
          valid: false,
          message: 'Please use your college ID: id@anurag.edu.in'
        }
      }

      const idPart = email.split('@')[0]
      const collegeIdPattern = /^(\d{2})(eg)(\d{3})([a-z])(\d{2})$/i

      if (!collegeIdPattern.test(idPart)) {
        return {
          valid: false,
          message: 'Invalid College ID format! Format: YYegDDDSRR@anurag.edu.in (e.g., 23eg105j13@anurag.edu.in)'
        }
      }

      return { valid: true }
    }

    const validation = validateCollegeId(email)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered! Please login instead.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 500 }
      )
    }

    // Extract roll number from email
    const rollNumber = email.split('@')[0]
    
    // Extract branch from roll number
    const branchMatch = rollNumber.match(/\d{2}([a-z]{2})\d{3}/i)
    const branch = branchMatch ? branchMatch[1].toUpperCase() : 'UNKNOWN'
    
    // Extract year from roll number
    const yearPrefix = parseInt(rollNumber.substring(0, 2))
    const currentYear = new Date().getFullYear() % 100
    const yearDiff = currentYear - yearPrefix
    const academicYear = yearDiff >= 0 && yearDiff <= 4 ? yearDiff + 1 : 1

    // Create profile entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        auth_id: authData.user.id,
        email,
        name,
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

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // Map profile_picture to photo_url for frontend compatibility
    const profileWithPhotoUrl = {
      ...profile,
      photo_url: profile.profile_picture,
      department: profile.branch
    }

    console.log('✅ Signup successful! Returning profile:', profileWithPhotoUrl.email)

    return NextResponse.json({ 
      user: profileWithPhotoUrl,
      profile: profileWithPhotoUrl,
      authUser: authData.user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleLogin(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate College ID Format
    if (!email.endsWith('@anurag.edu.in')) {
      return NextResponse.json(
        { error: 'Please login with your college ID: id@anurag.edu.in' },
        { status: 400 }
      )
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Auth login error:', authError)
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Account not found! Please signup first.' },
        { status: 401 }
      )
    }

    console.log('🔍 Looking for profile with email:', email)

    // Get user profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Profile query result:', { profile: profile?.id, profileError })

    if (profileError || !profile) {
      console.error('❌ Profile not found for email:', email)
      return NextResponse.json(
        { error: 'Profile not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Check if user is banned
    const { data: ban } = await supabaseAdmin
      .from('banned_users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (ban) {
      return NextResponse.json(
        { 
          error: 'Your account has been banned',
          banned: true,
          reason: ban.reason,
          bannedAt: ban.created_at
        },
        { status: 403 }
      )
    }

    // Map profile_picture to photo_url and branch to department
    const profileWithMappedFields = {
      ...profile,
      photo_url: profile.profile_picture,
      department: profile.branch
    }

    console.log('✅ Login successful! Returning profile:', profileWithMappedFields.email)
    console.log('📋 Profile fields:', {
      name: profileWithMappedFields.name,
      branch: profileWithMappedFields.branch,
      department: profileWithMappedFields.department,
      year: profileWithMappedFields.year,
      bio: profileWithMappedFields.bio,
      age: profileWithMappedFields.age,
      gender: profileWithMappedFields.gender
    })

    return NextResponse.json({ 
      user: profileWithMappedFields,
      profile: profileWithMappedFields,
      session: authData.session
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Profile Routes
async function handleGetProfileByClerkId(request) {
  try {
    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Clerk User ID required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching profile for Clerk user:', clerkUserId)

    // Get profile by clerk_user_id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Get profile by Clerk ID error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      console.log('❌ No profile found for Clerk user:', clerkUserId)
      return NextResponse.json({ profile: null })
    }

    console.log('✅ Found profile:', profile.id)
    
    // Map profile_picture to photo_url for frontend compatibility
    const profileWithPhotoUrl = {
      ...profile,
      photo_url: profile.profile_picture,
      department: profile.branch
    }

    return NextResponse.json({ profile: profileWithPhotoUrl })
  } catch (error) {
    console.error('❌ Get profile by Clerk ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGetProfiles(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching all profiles for user:', userId)

    // Get all profiles except current user
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, bio, age, gender, branch, year, location, instagram, github, linkedin, interests, hobbies, profile_picture, email, created_at')
      .neq('id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Get profiles error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    console.log('✅ Fetched', profiles?.length || 0, 'profiles from database')
    
    // Map profile_picture to photo_url for frontend compatibility
    const profilesWithPhotoUrl = profiles.map(p => ({
      ...p,
      photo_url: p.profile_picture,
      department: p.branch
    }))

    return NextResponse.json({ profiles: profilesWithPhotoUrl || [] })
  } catch (error) {
    console.error('❌ Get profiles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateProfileFromClerk(request) {
  try {
    const body = await request.json()
    const { clerkUserId, email, name } = body

    console.log('🔨 Creating profile for Clerk user:', clerkUserId, email)

    // Check if email is permanently banned
    const { data: bannedUser } = await supabase
      .from('banned_users')
      .select('*')
      .eq('email', email)
      .eq('is_permanent', true)
      .single()

    if (bannedUser) {
      console.log('🚫 Permanently banned user tried to sign up:', email)
      
      // Delete the Clerk account immediately
      try {
        const client = await clerkClient()
        await client.users.deleteUser(clerkUserId)
        console.log('✅ Deleted banned user from Clerk:', clerkUserId)
      } catch (clerkError) {
        console.error('⚠️ Failed to delete from Clerk:', clerkError.message)
      }

      return NextResponse.json(
        { error: 'This account has been permanently banned and cannot be used. Contact admin for details.' },
        { status: 403 }
      )
    }

    // Extract roll number from email
    const rollNumber = email.split('@')[0]
    
    // Extract branch from roll number (YYegDDDSRR format)
    const branchMatch = rollNumber.match(/\d{2}([a-z]{2})\d{3}/i)
    const branch = branchMatch ? branchMatch[1].toUpperCase() : 'UNKNOWN'
    
    // Extract year from roll number
    const yearPrefix = parseInt(rollNumber.substring(0, 2))
    const currentYear = new Date().getFullYear() % 100
    const yearDiff = currentYear - yearPrefix
    const academicYear = yearDiff >= 0 && yearDiff <= 4 ? yearDiff + 1 : 1

    // Check if profile already exists with this email (from old Supabase auth)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (existingProfile) {
      console.log('✅ Profile already exists, updating with Clerk user ID:', existingProfile.id)
      
      // Update existing profile with Clerk user ID
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          clerk_user_id: clerkUserId,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json(
          { error: `Failed to update profile: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Map profile_picture to photo_url for frontend compatibility
      const profileWithPhotoUrl = {
        ...updatedProfile,
        photo_url: updatedProfile.profile_picture,
        department: updatedProfile.branch
      }

      return NextResponse.json({ profile: profileWithPhotoUrl })
    }

    // Create new profile entry with Clerk user ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: uuidv4(), // Generate new UUID for profile ID
        clerk_user_id: clerkUserId, // Store Clerk user ID
        email,
        name,
        roll_number: rollNumber,
        branch: branch,
        year: academicYear,
        gender: 'prefer_not_to_say',
        age: 18,
        is_verified: true, // Clerk handles email verification
        is_active: true
      }])
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Profile created successfully:', profile.id)

    // Map profile_picture to photo_url for frontend compatibility
    const profileWithPhotoUrl = {
      ...profile,
      photo_url: profile.profile_picture,
      department: profile.branch
    }

    return NextResponse.json({ profile: profileWithPhotoUrl })
  } catch (error) {
    console.error('Create profile from Clerk error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdateProfile(request) {
  try {
    const body = await request.json()
    const { userId, name, bio, age, gender, profile_picture, photo_url, location, instagram, github, linkedin, interests, hobbies, department, year } = body

    // Build update object with only provided fields
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (age !== undefined) updateData.age = age
    if (gender !== undefined) updateData.gender = gender
    // Accept both profile_picture and photo_url (map photo_url to profile_picture)
    if (photo_url !== undefined) updateData.profile_picture = photo_url
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture
    if (location !== undefined) updateData.location = location
    if (instagram !== undefined) updateData.instagram = instagram
    if (github !== undefined) updateData.github = github
    if (linkedin !== undefined) updateData.linkedin = linkedin
    if (interests !== undefined) updateData.interests = interests
    if (hobbies !== undefined) updateData.hobbies = hobbies
    if (department !== undefined) updateData.branch = department // Map department to branch
    if (year !== undefined) updateData.year = year
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      )
    }

    // Map profile_picture to photo_url for frontend compatibility
    const profileWithPhotoUrl = {
      ...data,
      photo_url: data.profile_picture,
      department: data.branch
    }

    return NextResponse.json({ profile: profileWithPhotoUrl })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Like Routes - FIXED to use liker_id and liked_id
async function handleLike(request) {
  try {
    const body = await request.json()
    const { fromUserId, toUserId } = body

    // Check if already liked - FIXED column names
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', fromUserId)
      .eq('liked_id', toUserId)
      .single()

    if (existingLike) {
      // Unlike: Delete the existing like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Unlike error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to unlike user' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, unliked: true })
    }

    // Create like - FIXED column names
    const { error: likeError } = await supabase
      .from('likes')
      .insert([{
        liker_id: fromUserId,
        liked_id: toUserId
      }])

    if (likeError) {
      console.error('Like error:', likeError)
      return NextResponse.json(
        { error: 'Failed to like user' },
        { status: 500 }
      )
    }

    // Increment like counter using SQL function
    await supabase.rpc('increment_like_count', { profile_id: toUserId })

    // Check if it's a match - FIXED column names
    const { data: reciprocalLike } = await supabase
      .from('likes')
      .select('id')
      .eq('liker_id', toUserId)
      .eq('liked_id', fromUserId)
      .single()

    let matched = false

    if (reciprocalLike) {
      matched = true
      const [user1Id, user2Id] = [fromUserId, toUserId].sort()

      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1id.eq.${user1Id},user2id.eq.${user2Id}),and(user1id.eq.${user2Id},user2id.eq.${user1Id})`)
        .single()

      if (!existingMatch) {
        await supabase
          .from('matches')
          .insert([{
            user1id: user1Id,
            user2id: user2Id
          }])
      }
    }

    return NextResponse.json({ success: true, matched })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's likes - FIXED
async function handleGetLikes(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('liker_id', userId)

    if (error) {
      console.error('Get likes error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ likes: likes || [] })
  } catch (error) {
    console.error('Get likes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Match Routes - FIXED to use correct column names
async function handleGetMatches(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get matches where user is either user1 or user2
    const { data: matches, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .or(`user1id.eq.${userId},user2id.eq.${userId}`)
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Get matches error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Get blocked users for current user
    const { data: blockedByMe } = await supabaseAdmin
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', userId)

    const { data: blockedMe } = await supabaseAdmin
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocked_id', userId)

    const blockedUserIds = new Set([
      ...(blockedByMe || []).map(b => b.blocked_id),
      ...(blockedMe || []).map(b => b.blocker_id)
    ])

    // Get profile details for matched users
    const matchesWithProfiles = await Promise.all(
      (matches || []).map(async (match) => {
        const matchedUserId = match.user1id === userId ? match.user2id : match.user1id
        
        const isBlocked = blockedUserIds.has(matchedUserId)
        const blockedBy = blockedMe?.find(b => b.blocker_id === matchedUserId) ? 'them' : 
                         blockedByMe?.find(b => b.blocked_id === matchedUserId) ? 'me' : null
        
        // FIXED: Use correct column names from profiles table
        const { data: matchedUser } = await supabaseAdmin
          .from('profiles')
          .select('id, name, bio, branch, year, interests, profile_picture')
          .eq('id', matchedUserId)
          .single()

        // Get most recent message
        const { data: lastMessage } = await supabaseAdmin
          .from('messages')
          .select('created_at')
          .eq('sender_id', userId)
          .eq('receiver_id', matchedUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const { data: lastMessage2 } = await supabaseAdmin
          .from('messages')
          .select('created_at')
          .eq('sender_id', matchedUserId)
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const lastMessageTime = lastMessage?.created_at || lastMessage2?.created_at || match.createdat

        // Map to frontend expected format
        const mappedUser = matchedUser ? {
          ...matchedUser,
          photo_url: matchedUser.profile_picture,
          department: matchedUser.branch
        } : null

        return {
          ...match,
          matchedUser: mappedUser,
          isBlocked,
          blockedBy,
          lastMessageTime
        }
      })
    )

    // Sort by last message time
    matchesWithProfiles.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime).getTime()
      const timeB = new Date(b.lastMessageTime).getTime()
      return timeB - timeA
    })

    return NextResponse.json({ matches: matchesWithProfiles })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Message Routes - FIXED to use sender_id and receiver_id
async function handleGetMessages(request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    console.log('📥 GET /api/messages - matchId:', matchId)

    if (!matchId) {
      console.log('❌ No matchId provided')
      return NextResponse.json(
        { error: 'Match ID required' },
        { status: 400 }
      )
    }

    // Get the match to find user IDs
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error('❌ Match not found:', matchError)
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const userId1 = match.user1id
    const userId2 = match.user2id

    console.log('🔍 Querying messages between users:', userId1, userId2)

    // Get messages between these two users (bidirectional)
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Get messages error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${messages?.length || 0} messages`)

    // Map to frontend expected format
    const mappedMessages = (messages || []).map(msg => ({
      id: msg.id,
      matchId: matchId,
      senderId: msg.sender_id,
      message: msg.content,
      createdAt: msg.created_at
    }))

    return NextResponse.json({ messages: mappedMessages })
  } catch (error) {
    console.error('💥 FATAL Get messages error:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function handleSendMessage(request) {
  try {
    const body = await request.json()
    const { matchId, senderId, message } = body

    console.log('📤 POST /api/messages - matchId:', matchId, 'senderId:', senderId)

    // Get the match to find receiver ID
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error('❌ Match not found:', matchError)
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Determine receiver ID (the other user in the match)
    const receiverId = match.user1id === senderId ? match.user2id : match.user1id

    console.log('📨 Sending message from', senderId, 'to', receiverId)

    // Insert message with sender_id and receiver_id
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        content: message
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Send message error:', error)
      return NextResponse.json(
        { error: 'Failed to send message', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Message sent successfully')

    // Map to frontend format
    const mappedMessage = {
      id: data.id,
      matchId: matchId,
      senderId: data.sender_id,
      message: data.content,
      createdAt: data.created_at
    }

    return NextResponse.json({ message: mappedMessage })
  } catch (error) {
    console.error('💥 FATAL Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Online Status Routes
async function handleGetOnlineUsers(request) {
  try {
    const activeUserIds = Array.from(onlineUsers.keys())
    return NextResponse.json({ onlineUsers: activeUserIds })
  } catch (error) {
    console.error('Get online users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdateOnlineStatus(request) {
  try {
    const text = await request.text()
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const body = JSON.parse(text)
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    onlineUsers.set(userId, Date.now())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update online status error:', error)
    return NextResponse.json(
      { error: 'Invalid request: ' + error.message },
      { status: 400 }
    )
  }
}

// Admin Routes
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: hashPassword('admin123')
}

async function handleAdminLogin(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (username === ADMIN_CREDENTIALS.username && verifyPassword(password, ADMIN_CREDENTIALS.password)) {
      return NextResponse.json({
        success: true,
        admin: { username: 'admin', role: 'admin' }
      })
    }

    return NextResponse.json(
      { error: 'Invalid admin credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleAdminGetUsers(request) {
  try {
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order(sortBy, { ascending: false })

    if (error) throw error

    // Get match counts for each user - FIXED column names
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const { count: matchCount } = await supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1id.eq.${user.id},user2id.eq.${user.id}`)

      const { count: likesSent } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('liker_id', user.id)

      const { count: likesReceived } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('liked_id', user.id)

      return {
        ...user,
        photo_url: user.profile_picture,
        department: user.branch,
        matchCount: matchCount || 0,
        likesSent: likesSent || 0,
        likesReceived: likesReceived || 0,
        isOnline: onlineUsers.has(user.id)
      }
    }))

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleAdminGetConversations(request) {
  try {
    const { data: matches, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .order('createdat', { ascending: false })

    if (error) throw error

    const conversationsWithDetails = await Promise.all(matches.map(async (match) => {
      const { data: user1 } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, profile_picture, branch, year')
        .eq('id', match.user1id)
        .single()

      const { data: user2 } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, profile_picture, branch, year')
        .eq('id', match.user2id)
        .single()

      const { data: messages, count: messageCount } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact' })
        .or(`and(sender_id.eq.${match.user1id},receiver_id.eq.${match.user2id}),and(sender_id.eq.${match.user2id},receiver_id.eq.${match.user1id})`)
        .order('created_at', { ascending: false })

      const lastMessage = messages && messages.length > 0 ? messages[0] : null

      return {
        matchId: match.id,
        user1: user1 ? { ...user1, photo_url: user1.profile_picture, department: user1.branch } : null,
        user2: user2 ? { ...user2, photo_url: user2.profile_picture, department: user2.branch } : null,
        messageCount: messageCount || 0,
        lastMessage,
        createdAt: match.createdat,
        user1Online: onlineUsers.has(match.user1id),
        user2Online: onlineUsers.has(match.user2id)
      }
    }))

    return NextResponse.json({ conversations: conversationsWithDetails })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleAdminGetStats(request) {
  try {
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })

    const { count: totalMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })

    const { count: totalLikes } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: newUsers } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    const onlineCount = onlineUsers.size

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalMatches: totalMatches || 0,
        totalMessages: totalMessages || 0,
        totalLikes: totalLikes || 0,
        newUsers: newUsers || [],
        onlineUsers: onlineCount
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleSendWarning(request) {
  try {
    const body = await request.json()
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      )
    }

    // FIXED: Use correct column names (user_id instead of userId, reason instead of message)
    const { data: warning, error } = await supabase
      .from('warnings')
      .insert({
        user_id: userId,
        reason: message,
        severity: 'medium',
        resolved: false
      })
      .select()
      .single()

    if (error) throw error

    const { data: allWarnings, error: countError } = await supabase
      .from('warnings')
      .select('id')
      .eq('user_id', userId)

    if (countError) throw countError

    const warningCount = allWarnings?.length || 0

    // Auto-ban if user has 5 or more warnings
    if (warningCount >= 5) {
      const { data: existingBan } = await supabase
        .from('banned_users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!existingBan) {
        await supabase
          .from('banned_users')
          .insert({
            user_id: userId,
            reason: `Automatically banned for receiving ${warningCount} warnings`,
            ban_type: 'permanent'
          })

        onlineUsers.delete(userId)

        return NextResponse.json({
          success: true,
          warning,
          autoBanned: true,
          warningCount,
          message: `User has been automatically banned after receiving ${warningCount} warnings`
        })
      }
    }

    return NextResponse.json({
      success: true,
      warning,
      warningCount,
      message: warningCount >= 3 ? `Warning sent. User has ${warningCount} warnings total. Will be auto-banned at 5 warnings.` : 'Warning sent successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetWarnings(request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // FIXED: Use correct column names
    const { data: warnings, error } = await supabase
      .from('warnings')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ warnings: warnings || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleMarkWarningAsRead(request) {
  try {
    const body = await request.json()
    const { warningId } = body

    if (!warningId) {
      return NextResponse.json(
        { error: 'warningId is required' },
        { status: 400 }
      )
    }

    // FIXED: Use resolved column
    const { error } = await supabase
      .from('warnings')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', warningId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Ban/Unban User Functions - FIXED
async function handleBanUser(request) {
  try {
    const body = await request.json()
    const { userId, reason, bannedBy } = body

    if (!userId || !reason || !bannedBy) {
      return NextResponse.json(
        { error: 'userId, reason, and bannedBy are required' },
        { status: 400 }
      )
    }

    // FIXED: Use correct column names
    const { data: existingBan } = await supabase
      .from('banned_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingBan) {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      )
    }

    const { data: ban, error } = await supabase
      .from('banned_users')
      .insert({
        user_id: userId,
        banned_by: bannedBy,
        reason,
        ban_type: 'permanent'
      })
      .select()
      .single()

    if (error) throw error

    onlineUsers.delete(userId)

    return NextResponse.json({
      success: true,
      ban
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleUnbanUser(request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // FIXED: Just delete the ban record
    const { data, error } = await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', userId)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'User is not currently banned' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'User unbanned successfully',
      unbannedRecords: data.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetBannedUsers(request) {
  try {
    // FIXED: No isactive column, just get all bans
    const { data: bans, error } = await supabase
      .from('banned_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const bansWithDetails = await Promise.all(
      (bans || []).map(async (ban) => {
        const { data: user } = await supabase
          .from('profiles')
          .select('id, name, email, profile_picture, branch, year')
          .eq('id', ban.user_id)
          .single()

        return {
          ...ban,
          user: user ? { ...user, photo_url: user.profile_picture, department: user.branch } : null
        }
      })
    )

    return NextResponse.json({ bannedUsers: bansWithDetails })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleCheckBanStatus(request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // FIXED: Use user_id column
    const { data: ban, error } = await supabase
      .from('banned_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      isBanned: !!ban,
      ban: ban || null
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Delete User Function - FIXED
async function handleDeleteUser(request) {
  try {
    const body = await request.json()
    const { userId, adminPassword } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (adminPassword !== 'admin123') {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 }
      )
    }

    // Get user's clerk_user_id and email before deleting
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clerk_user_id, email, name')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('🗑️ Deleting user:', profile.name, profile.email)

    // Remove from online users
    onlineUsers.delete(userId)

    // Delete all related data from Supabase using ADMIN client
    // Warnings
    await supabaseAdmin.from('warnings').delete().eq('user_id', userId)

    // Messages
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    // Matches
    await supabaseAdmin.from('matches').delete().or(`user1id.eq.${userId},user2id.eq.${userId}`)

    // Likes
    await supabaseAdmin.from('likes').delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`)

    // Blocked users
    await supabaseAdmin.from('blocked_users').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

    // Friend requests
    await supabaseAdmin.from('friend_requests').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    // Add to permanent ban list BEFORE deleting profile
    if (profile?.email) {
      await supabaseAdmin
        .from('banned_users')
        .upsert({
          userid: userId,
          email: profile.email,
          name: profile.name || 'Unknown',
          reason: 'Account permanently deleted by admin',
          bannedby: 'admin',
          bannedat: new Date().toISOString(),
          is_permanent: true, // Mark as permanent ban
          isactive: true
        })
    }

    // Delete profile from Supabase using ADMIN client
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Profile deletion error:', profileError)
      throw profileError
    }

    console.log('✅ Deleted profile from Supabase:', userId)

    // Delete from Clerk if they have a Clerk account
    if (profile?.clerk_user_id) {
      try {
        const client = await clerkClient()
        await client.users.deleteUser(profile.clerk_user_id)
        console.log('✅ Deleted user from Clerk:', profile.clerk_user_id)
      } catch (clerkError) {
        console.error('⚠️ Failed to delete from Clerk:', clerkError.message)
        // Continue even if Clerk deletion fails - Supabase data is already deleted
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User permanently deleted from database and Clerk. They cannot login again.',
      deletedEmail: profile?.email
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Friend Request handlers
async function handleSendFriendRequest(request) {
  try {
    const { senderId, receiverId } = await request.json()

    const [matchCheck, requestCheck, blockCheck] = await Promise.all([
      supabaseAdmin
        .from('matches')
        .select('id')
        .or(`and(user1Id.eq.${senderId},user2Id.eq.${receiverId}),and(user1Id.eq.${receiverId},user2Id.eq.${senderId})`)
        .maybeSingle(),
      
      supabaseAdmin
        .from('friend_requests')
        .select('id')
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending')
        .maybeSingle(),
      
      supabaseAdmin
        .from('blocked_users')
        .select('blocker_id')
        .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${senderId})`)
        .maybeSingle()
    ])

    if (matchCheck.data) {
      return NextResponse.json(
        { error: 'You are already friends' },
        { status: 400 }
      )
    }

    if (requestCheck.data) {
      return NextResponse.json(
        { error: 'Friend request already sent' },
        { status: 400 }
      )
    }

    if (blockCheck.data) {
      return NextResponse.json(
        { error: 'Cannot send friend request' },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending'
      })

    if (error) throw error

    // 🎯 INCREMENT LIKE COUNTS for the RECEIVER (person receiving the request)
    // When User A sends request to User B → User B's likes increase immediately
    try {
      console.log('🎯 Incrementing likes for RECEIVER:', receiverId)

      const { data: receiverProfile } = await supabaseAdmin
        .from('profiles')
        .select('total_likes, daily_likes, weekly_likes')
        .eq('id', receiverId)
        .single()

      if (receiverProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            total_likes: (receiverProfile.total_likes || 0) + 1,
            daily_likes: (receiverProfile.daily_likes || 0) + 1,
            weekly_likes: (receiverProfile.weekly_likes || 0) + 1
          })
          .eq('id', receiverId)

        console.log('✅ Like counts incremented for receiver')
      }
    } catch (likeError) {
      console.error('⚠️ Error incrementing likes:', likeError)
      // Don't fail the request if like increment fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Send friend request error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetSentRequests(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('📤 Loading sent friend requests for userId:', userId)

    const { data: sentRequests, error } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error loading sent requests:', error)
      throw error
    }

    console.log('✅ Found', sentRequests?.length || 0, 'sent friend requests')

    return NextResponse.json(sentRequests || [])
  } catch (error) {
    console.error('❌ Get sent requests error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetPendingRequests(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('📥 Loading friend requests for userId:', userId)

    const { data: requests, error } = await supabaseAdmin
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error loading friend requests:', error)
      throw error
    }

    console.log('📋 Found', requests?.length || 0, 'friend requests')

    const { data: existingMatches } = await supabaseAdmin
      .from('matches')
      .select('user1id, user2id')
      .or(`user1id.eq.${userId},user2id.eq.${userId}`)

    const matchedUserIds = new Set(
      (existingMatches || []).map(match => 
        match.user1id === userId ? match.user2id : match.user1id
      )
    )

    const pendingRequests = (requests || []).filter(req => !matchedUserIds.has(req.sender_id))

    const requestsWithProfiles = await Promise.all(
      pendingRequests.map(async (req) => {
        const { data: senderProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, bio, branch, year, interests, profile_picture, email')
          .eq('id', req.sender_id)
          .single()

        if (profileError) {
          console.error('❌ Error loading sender profile:', profileError)
          return {
            ...req,
            name: 'Unknown User',
            bio: '',
            department: '',
            year: '',
            interests: [],
            photo_url: '',
            email: '',
            requestedAt: req.created_at
          }
        }

        return {
          id: req.id,
          sender_id: req.sender_id,
          receiver_id: req.receiver_id,
          status: req.status,
          created_at: req.created_at,
          requestedAt: req.created_at,
          ...senderProfile,
          photo_url: senderProfile.profile_picture,
          department: senderProfile.branch
        }
      })
    )

    console.log('✅ Returning', requestsWithProfiles.length, 'requests with full profiles')

    return NextResponse.json(requestsWithProfiles)
  } catch (error) {
    console.error('❌ Get pending requests error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleAcceptFriendRequest(request) {
  try {
    const { requestId, userId1, userId2 } = await request.json()

    console.log('✅ Accepting friend request:', { requestId, userId1, userId2 })

    const { error: updateError } = await supabaseAdmin
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) {
      console.error('❌ Error updating friend request:', updateError)
      throw updateError
    }

    const { data: existingMatch } = await supabaseAdmin
      .from('matches')
      .select('id')
      .or(`and(user1id.eq.${userId1},user2id.eq.${userId2}),and(user1id.eq.${userId2},user2id.eq.${userId1})`)
      .single()

    if (existingMatch) {
      console.log('⚠️ Match already exists, skipping creation')
      return NextResponse.json({
        success: true,
        message: 'Friend request accepted (match already exists)'
      })
    }

    const { data: newMatch, error: matchError } = await supabaseAdmin
      .from('matches')
      .insert({
        user1id: userId1,
        user2id: userId2
      })
      .select()

    if (matchError) {
      console.error('❌ Error creating match:', matchError)
      throw matchError
    }

    console.log('✅ Match created successfully')

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
      match: newMatch
    })
  } catch (error) {
    console.error('❌ Accept friend request error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleRejectFriendRequest(request) {
  try {
    const { requestId } = await request.json()

    const { error } = await supabaseAdmin
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Friend request rejected'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleDecrementLike(request) {
  try {
    const { profileId } = await request.json()

    console.log('💔 Decrementing like counts for profile:', profileId)

    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('total_likes, daily_likes, weekly_likes')
      .eq('id', profileId)
      .single()

    if (fetchError) throw fetchError

    const newTotalLikes = Math.max((currentProfile.total_likes || 0) - 1, 0)
    const newDailyLikes = Math.max((currentProfile.daily_likes || 0) - 1, 0)
    const newWeeklyLikes = Math.max((currentProfile.weekly_likes || 0) - 1, 0)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        total_likes: newTotalLikes,
        daily_likes: newDailyLikes,
        weekly_likes: newWeeklyLikes
      })
      .eq('id', profileId)
      .select('id, total_likes, daily_likes, weekly_likes')
      .single()

    if (error) throw error

    console.log('✅ Like counts decremented:', data)

    return NextResponse.json({
      success: true,
      message: 'Like count decremented',
      profile: data
    })
  } catch (error) {
    console.error('❌ Decrement like error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Block user handlers - FIXED
async function handleBlockUser(request) {
  try {
    const { blockerId, blockedId } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId
      })
      .select()
      .single()

    if (error) throw error

    // Delete likes - FIXED column names
    await supabase
      .from('likes')
      .delete()
      .or(`and(liker_id.eq.${blockerId},liked_id.eq.${blockedId}),and(liker_id.eq.${blockedId},liked_id.eq.${blockerId})`)

    return NextResponse.json({
      success: true,
      message: 'User blocked'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleUnblockUser(request) {
  try {
    const { blockerId, blockedId } = await request.json()

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'User unblocked'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetBlockedUsers(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const { data, error } = await supabaseAdmin
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', userId)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleRemoveFriend(request) {
  try {
    const { userId1, userId2 } = await request.json()

    console.log('🗑️ Removing friendship between:', userId1, userId2)

    // Delete all chat messages between these users (save storage!)
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)

    if (messagesError) {
      console.error('❌ Error deleting messages:', messagesError)
    } else {
      console.log('✅ All chat messages deleted')
    }

    // Delete match
    const { error } = await supabaseAdmin
      .from('matches')
      .delete()
      .or(`and(user1id.eq.${userId1},user2id.eq.${userId2}),and(user1id.eq.${userId2},user2id.eq.${userId1})`)

    if (error) throw error

    // Delete friend requests
    await supabaseAdmin
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)

    // Delete likes - FIXED column names
    await supabaseAdmin
      .from('likes')
      .delete()
      .or(`and(liker_id.eq.${userId1},liked_id.eq.${userId2}),and(liker_id.eq.${userId2},liked_id.eq.${userId1})`)

    console.log('✅ Friendship removed successfully')

    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully, all chat history deleted'
    })
  } catch (error) {
    console.error('❌ Error removing friend:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Event Management Routes
async function handleGetEvents(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'upcoming'

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    // Map location to venue for frontend compatibility
    const eventsWithVenue = (data || []).map(event => ({
      ...event,
      venue: event.location
    }))

    return NextResponse.json({ events: eventsWithVenue })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleCreateEvent(request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      event_date,
      event_time,
      venue,
      club_name,
      organizer,
      guests,
      category,
      image_url,
      max_capacity,
      registration_required,
      registration_link,
      contact_email,
      contact_phone
    } = body

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        title,
        description,
        event_date,
        event_time,
        location: venue, // Map venue to location column
        club_name,
        organizer,
        guests,
        category,
        image_url,
        max_capacity,
        registration_required,
        registration_link,
        contact_email,
        contact_phone,
        status: 'upcoming',
        created_by: 'admin',
        current_participants: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleUpdateEvent(request) {
  try {
    const body = await request.json()
    const { eventId, venue, ...updates } = body

    // Map venue to location if provided
    const updateData = { ...updates }
    if (venue !== undefined) {
      updateData.location = venue
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    // Map location back to venue for frontend
    const eventWithVenue = {
      ...data,
      venue: data.location
    }

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: eventWithVenue
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleDeleteEvent(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Leaderboard Routes
async function handleGetLeaderboard(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const limit = parseInt(searchParams.get('limit') || '20')

    let orderColumn = 'total_likes'
    if (type === 'daily') orderColumn = 'daily_likes'
    if (type === 'weekly') orderColumn = 'weekly_likes'

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, profile_picture, branch, year, bio, interests, gender, daily_likes, weekly_likes, total_likes, profile_views')
      .gt(orderColumn, 0) // Only get profiles with likes > 0
      .order(orderColumn, { ascending: false })
      .limit(limit)

    if (error) throw error

    // Map to frontend format
    const leaderboard = (data || []).map(profile => ({
      ...profile,
      photo_url: profile.profile_picture,
      department: profile.branch
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Claim Bonus Reward
async function handleClaimBonusReward(request) {
  try {
    const body = await request.json()
    const { userId, rewardType } = body // rewardType: 'daily' or 'weekly'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First, get current likes
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('daily_likes, weekly_likes, total_likes')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    // Add 3 likes to user's daily_likes (or weekly_likes)
    const column = rewardType === 'weekly' ? 'weekly_likes' : 'daily_likes'
    
    const updateData = {
      [column]: (profile[column] || 0) + 3,
      total_likes: (profile.total_likes || 0) + 3
    }
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('daily_likes, weekly_likes, total_likes')
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      message: '3 bonus likes added to your profile!',
      likes: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 🎲 FOMO DICE FEATURE HANDLERS

// Roll the dice (once per day)
async function handleRollDice(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Check if user already rolled today
    const { data: existingRoll } = await supabaseAdmin
      .from('dice_rolls')
      .select('*')
      .eq('user_id', userId)
      .eq('roll_date', today)
      .single()

    if (existingRoll) {
      return NextResponse.json({
        alreadyRolled: true,
        roll: existingRoll,
        message: 'You already rolled today! Come back tomorrow.'
      })
    }

    // Generate truly random number 1-6
    const diceNumber = Math.floor(Math.random() * 6) + 1

    // Save the roll
    const { data: newRoll, error } = await supabaseAdmin
      .from('dice_rolls')
      .insert({
        user_id: userId,
        dice_number: diceNumber,
        roll_date: today
      })
      .select()
      .single()

    if (error) throw error

    console.log(`🎲 User ${userId} rolled: ${diceNumber}`)

    return NextResponse.json({
      success: true,
      roll: newRoll,
      diceNumber,
      message: `You rolled a ${diceNumber}! 🎲`
    })
  } catch (error) {
    console.error('❌ Roll dice error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Get users who rolled the same number today
async function handleGetDiceMatches(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Get user's roll for today
    const { data: myRoll, error: myRollError } = await supabaseAdmin
      .from('dice_rolls')
      .select('*')
      .eq('user_id', userId)
      .eq('roll_date', today)
      .single()

    if (myRollError || !myRoll) {
      return NextResponse.json({
        hasRolled: false,
        matches: [],
        message: 'You haven\'t rolled today yet!'
      })
    }

    // Get all users who rolled the same number today (excluding current user)
    const { data: matchingRolls, error: matchError } = await supabaseAdmin
      .from('dice_rolls')
      .select('user_id, dice_number, rolled_at, has_selected_match')
      .eq('roll_date', today)
      .eq('dice_number', myRoll.dice_number)
      .neq('user_id', userId)

    if (matchError) throw matchError

    // Get profile details for matched users
    const matchesWithProfiles = await Promise.all(
      (matchingRolls || []).map(async (roll) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, name, bio, age, gender, branch, year, interests, hobbies, profile_picture, instagram')
          .eq('id', roll.user_id)
          .single()

        return {
          ...profile,
          photo_url: profile?.profile_picture,
          department: profile?.branch,
          diceNumber: roll.dice_number,
          rolledAt: roll.rolled_at,
          hasSelectedMatch: roll.has_selected_match
        }
      })
    )

    console.log(`🎲 Found ${matchesWithProfiles.length} users who rolled ${myRoll.dice_number}`)

    return NextResponse.json({
      hasRolled: true,
      myDiceNumber: myRoll.dice_number,
      hasSelectedMatch: myRoll.has_selected_match,
      matches: matchesWithProfiles.filter(m => m !== null),
      message: `${matchesWithProfiles.length} users rolled ${myRoll.dice_number} today!`
    })
  } catch (error) {
    console.error('❌ Get dice matches error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Select a match (with double confirmation)
async function handleSelectDiceMatch(request) {
  try {
    const { userId, selectedUserId } = await request.json()

    if (!userId || !selectedUserId) {
      return NextResponse.json(
        { error: 'Both user IDs are required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Check if user already selected someone today
    const { data: myRoll } = await supabaseAdmin
      .from('dice_rolls')
      .select('*')
      .eq('user_id', userId)
      .eq('roll_date', today)
      .single()

    if (!myRoll) {
      return NextResponse.json(
        { error: 'You haven\'t rolled the dice today!' },
        { status: 400 }
      )
    }

    if (myRoll.has_selected_match) {
      return NextResponse.json(
        { error: 'You already selected someone today!' },
        { status: 400 }
      )
    }

    // Check if selected user rolled the same number
    const { data: theirRoll } = await supabaseAdmin
      .from('dice_rolls')
      .select('*')
      .eq('user_id', selectedUserId)
      .eq('roll_date', today)
      .single()

    if (!theirRoll || theirRoll.dice_number !== myRoll.dice_number) {
      return NextResponse.json(
        { error: 'This user didn\'t roll the same number!' },
        { status: 400 }
      )
    }

    // Check if they're already friends
    const { data: existingMatch } = await supabaseAdmin
      .from('matches')
      .select('id')
      .or(`and(user1id.eq.${userId},user2id.eq.${selectedUserId}),and(user1id.eq.${selectedUserId},user2id.eq.${userId})`)
      .single()

    if (existingMatch) {
      return NextResponse.json(
        { error: 'You are already friends with this user!' },
        { status: 400 }
      )
    }

    // Mark user as having selected a match
    await supabaseAdmin
      .from('dice_rolls')
      .update({
        has_selected_match: true,
        selected_user_id: selectedUserId
      })
      .eq('user_id', userId)

    // Create instant match (no friend request needed!)
    const [user1Id, user2Id] = [userId, selectedUserId].sort()
    
    const { data: newMatch, error: matchError } = await supabaseAdmin
      .from('matches')
      .insert({
        user1id: user1Id,
        user2id: user2Id
      })
      .select()
      .single()

    if (matchError) throw matchError

    // Create dice match record (expires in 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: diceMatch, error: diceMatchError } = await supabaseAdmin
      .from('dice_matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        dice_number: myRoll.dice_number,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (diceMatchError) throw diceMatchError

    console.log(`🎲 Instant match created! Users: ${userId} + ${selectedUserId}`)

    return NextResponse.json({
      success: true,
      match: newMatch,
      diceMatch,
      message: 'Instant match! You have 24 hours to chat or you\'ll be unmatched!',
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('❌ Select dice match error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Mark dice match as chatted (to prevent auto-unmatch)
async function handleMarkDiceMatchChatted(request) {
  try {
    const { userId, matchedUserId } = await request.json()

    const [user1Id, user2Id] = [userId, matchedUserId].sort()

    // Update dice match to mark as chatted
    const { error } = await supabaseAdmin
      .from('dice_matches')
      .update({ has_chatted: true })
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .eq('is_active', true)

    if (error) throw error

    console.log(`💬 Dice match marked as chatted: ${userId} + ${matchedUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Great! You\'re now permanent friends since you chatted!'
    })
  } catch (error) {
    console.error('❌ Mark dice match chatted error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Get active dice matches (to show expiry timer)
async function handleGetActiveDiceMatches(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: diceMatches, error } = await supabaseAdmin
      .from('dice_matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      diceMatches: diceMatches || []
    })
  } catch (error) {
    console.error('❌ Get active dice matches error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Get who selected you in dice
async function handleGetWhoSelectedMe(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Find rolls where someone selected this user today
    const { data: selectionsToday, error } = await supabaseAdmin
      .from('dice_rolls')
      .select('user_id, dice_number, selected_user_id')
      .eq('selected_user_id', userId)
      .eq('roll_date', today)

    if (error) throw error

    // Get profiles of users who selected you
    const selectionsWithProfiles = await Promise.all(
      (selectionsToday || []).map(async (selection) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, name, bio, age, gender, branch, year, interests, hobbies, profile_picture')
          .eq('id', selection.user_id)
          .single()

        return {
          ...profile,
          photo_url: profile?.profile_picture,
          department: profile?.branch,
          diceNumber: selection.dice_number
        }
      })
    )

    return NextResponse.json({
      selections: selectionsWithProfiles.filter(s => s !== null)
    })
  } catch (error) {
    console.error('❌ Get who selected me error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Main router
export async function GET(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/leaderboard')) {
    return handleGetLeaderboard(request)
  } else if (pathname.includes('/api/events')) {
    return handleGetEvents(request)
  } else if (pathname.includes('/api/profile-by-clerk')) {
    return handleGetProfileByClerkId(request)
  } else if (pathname.includes('/api/profiles')) {
    return handleGetProfiles(request)
  } else if (pathname.includes('/api/matches')) {
    return handleGetMatches(request)
  } else if (pathname.includes('/api/messages')) {
    return handleGetMessages(request)
  } else if (pathname.includes('/api/online')) {
    return handleGetOnlineUsers(request)
  } else if (pathname.includes('/api/likes')) {
    return handleGetLikes(request)
  } else if (pathname.includes('/api/admin/users')) {
    return handleAdminGetUsers(request)
  } else if (pathname.includes('/api/admin/conversations')) {
    return handleAdminGetConversations(request)
  } else if (pathname.includes('/api/admin/stats')) {
    return handleAdminGetStats(request)
  } else if (pathname.includes('/api/admin/banned-users')) {
    return handleGetBannedUsers(request)
  } else if (pathname.includes('/api/ban-status')) {
    return handleCheckBanStatus(request)
  } else if (pathname.includes('/api/warnings')) {
    return handleGetWarnings(request)
  } else if (pathname.includes('/api/friend-request/sent')) {
    return handleGetSentRequests(request)
  } else if (pathname.includes('/api/friend-request/pending')) {
    return handleGetPendingRequests(request)
  } else if (pathname.includes('/api/blocked-users')) {
    return handleGetBlockedUsers(request)
  } else if (pathname.includes('/api/dice/matches')) {
    return handleGetDiceMatches(request)
  } else if (pathname.includes('/api/dice/active-matches')) {
    return handleGetActiveDiceMatches(request)
  } else if (pathname.includes('/api/dice/who-selected-me')) {
    return handleGetWhoSelectedMe(request)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/events/create')) {
    return handleCreateEvent(request)
  } else if (pathname.includes('/api/events/update')) {
    return handleUpdateEvent(request)
  } else if (pathname.includes('/api/create-profile-clerk')) {
    return handleCreateProfileFromClerk(request)
  } else if (pathname.includes('/api/auth/signup')) {
    return handleSignup(request)
  } else if (pathname.includes('/api/auth/login')) {
    return handleLogin(request)
  } else if (pathname.includes('/api/auth/admin-login')) {
    return handleAdminLogin(request)
  } else if (pathname.includes('/api/profiles')) {
    return handleUpdateProfile(request)
  } else if (pathname.includes('/api/likes')) {
    return handleLike(request)
  } else if (pathname.includes('/api/messages')) {
    return handleSendMessage(request)
  } else if (pathname.includes('/api/online')) {
    return handleUpdateOnlineStatus(request)
  } else if (pathname.includes('/api/admin/ban-user')) {
    return handleBanUser(request)
  } else if (pathname.includes('/api/admin/unban-user')) {
    return handleUnbanUser(request)
  } else if (pathname.includes('/api/admin/send-warning')) {
    return handleSendWarning(request)
  } else if (pathname.includes('/api/warnings/mark-read')) {
    return handleMarkWarningAsRead(request)
  } else if (pathname.includes('/api/admin/delete-user')) {
    return handleDeleteUser(request)
  } else if (pathname.includes('/api/friend-request/send')) {
    return handleSendFriendRequest(request)
  } else if (pathname.includes('/api/friend-request/accept')) {
    return handleAcceptFriendRequest(request)
  } else if (pathname.includes('/api/friend-request/reject')) {
    return handleRejectFriendRequest(request)
  } else if (pathname.includes('/api/decrement-like')) {
    return handleDecrementLike(request)
  } else if (pathname.includes('/api/block-user')) {
    return handleBlockUser(request)
  } else if (pathname.includes('/api/unblock-user')) {
    return handleUnblockUser(request)
  } else if (pathname.includes('/api/remove-friend')) {
    return handleRemoveFriend(request)
  } else if (pathname.includes('/api/claim-bonus-reward')) {
    return handleClaimBonusReward(request)
  } else if (pathname.includes('/api/dice/roll')) {
    return handleRollDice(request)
  } else if (pathname.includes('/api/dice/select')) {
    return handleSelectDiceMatch(request)
  } else if (pathname.includes('/api/dice/mark-chatted')) {
    return handleMarkDiceMatchChatted(request)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/events/delete')) {
    return handleDeleteEvent(request)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}