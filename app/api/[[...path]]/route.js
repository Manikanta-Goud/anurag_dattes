import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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

    // Validate email domain
    if (!email.endsWith('@anurag.edu.in')) {
      return NextResponse.json(
        { error: 'Only @anurag.edu.in email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create user
    const userId = uuidv4()
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email,
        password: hashPassword(password),
        name,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    const { password: _, ...userWithoutPassword } = data
    return NextResponse.json({ user: userWithoutPassword })
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

    // Find user
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const { data: ban } = await supabase
      .from('banned_users')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .single()

    if (ban) {
      return NextResponse.json(
        { 
          error: 'Your account has been banned',
          banned: true,
          reason: ban.reason,
          bannedAt: ban.bannedAt
        },
        { status: 403 }
      )
    }

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Profile Routes
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

    // Get all profiles except current user (don't filter by likes)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, bio, department, year, interests, photo_url, email')
      .neq('id', userId)
      .limit(50)

    if (error) {
      console.error('Get profiles error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profiles: profiles || [] })
  } catch (error) {
    console.error('Get profiles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdateProfile(request) {
  try {
    const body = await request.json()
    const { userId, name, bio, department, year, interests, photo_url } = body

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name,
        bio,
        department,
        year,
        interests,
        photo_url
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    const { password: _, ...profileWithoutPassword } = data
    return NextResponse.json({ profile: profileWithoutPassword })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Like Routes
async function handleLike(request) {
  try {
    const body = await request.json()
    const { fromUserId, toUserId } = body

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('fromUserId', fromUserId)
      .eq('toUserId', toUserId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this user' },
        { status: 400 }
      )
    }

    // Create like
    const likeId = uuidv4()
    const { error: likeError } = await supabase
      .from('likes')
      .insert([{
        id: likeId,
        fromUserId,
        toUserId,
        createdAt: new Date().toISOString()
      }])

    if (likeError) {
      console.error('Like error:', likeError)
      return NextResponse.json(
        { error: 'Failed to like user' },
        { status: 500 }
      )
    }

    // Check if it's a match (other user also liked back)
    const { data: reciprocalLike } = await supabase
      .from('likes')
      .select('id')
      .eq('fromUserId', toUserId)
      .eq('toUserId', fromUserId)
      .single()

    let matched = false

    if (reciprocalLike) {
      // Create match
      matched = true
      const matchId = uuidv4()
      
      // Ensure consistent ordering (smaller ID first)
      const [user1Id, user2Id] = [fromUserId, toUserId].sort()

      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1Id.eq.${user1Id},user2Id.eq.${user2Id}),and(user1Id.eq.${user2Id},user2Id.eq.${user1Id})`)
        .single()

      if (!existingMatch) {
        await supabase
          .from('matches')
          .insert([{
            id: matchId,
            user1Id,
            user2Id,
            createdAt: new Date().toISOString()
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

// Get user's likes
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
      .eq('fromUserId', userId)

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

// Match Routes
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
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1Id.eq.${userId},user2Id.eq.${userId}`)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Get matches error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Get profile details for matched users
    const matchesWithProfiles = await Promise.all(
      (matches || []).map(async (match) => {
        const matchedUserId = match.user1Id === userId ? match.user2Id : match.user1Id
        
        const { data: matchedUser } = await supabase
          .from('profiles')
          .select('id, name, bio, department, year, interests, photo_url')
          .eq('id', matchedUserId)
          .single()

        return {
          ...match,
          matchedUser
        }
      })
    )

    return NextResponse.json({ matches: matchesWithProfiles })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Message Routes
async function handleGetMessages(request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID required' },
        { status: 400 }
      )
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('matchId', matchId)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('Get messages error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSendMessage(request) {
  try {
    const body = await request.json()
    const { matchId, senderId, message } = body

    const messageId = uuidv4()
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        id: messageId,
        matchId,
        senderId,
        message,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Send message error:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    // Check if request has a body
    const text = await request.text()
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    // Parse the JSON
    const body = JSON.parse(text)
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Update last seen timestamp
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
// Admin credentials (in production, store this securely in database)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: hashPassword('admin123') // Change this password!
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
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    
    // Get all users with their stats
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order(sortBy, { ascending: false })

    if (error) throw error

    // Get match counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`userId1.eq.${user.id},userId2.eq.${user.id}`)

      const { count: likesSent } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('likerId', user.id)

      const { count: likesReceived } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('likedId', user.id)

      return {
        ...user,
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
    // Get all matches with user details
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Get user details and message counts for each match
    const conversationsWithDetails = await Promise.all(matches.map(async (match) => {
      const { data: user1 } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url, department, year')
        .eq('id', match.user1Id)
        .single()

      const { data: user2 } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url, department, year')
        .eq('id', match.user2Id)
        .single()

      const { data: messages, count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('matchId', match.id)
        .order('createdAt', { ascending: false })

      const lastMessage = messages && messages.length > 0 ? messages[0] : null

      return {
        matchId: match.id,
        user1,
        user2,
        messageCount: messageCount || 0,
        lastMessage,
        createdAt: match.createdAt,
        user1Online: onlineUsers.has(match.user1Id),
        user2Online: onlineUsers.has(match.user2Id)
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
    // Get total counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    const { count: totalLikes } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })

    // Get newly joined users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: newUsers } = await supabase
      .from('profiles')
      .select('*')
      .gte('createdAt', sevenDaysAgo.toISOString())
      .order('createdAt', { ascending: false })

    // Get online users count
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

    // Create warning in database
    const { data: warning, error } = await supabase
      .from('warnings')
      .insert({
        id: uuidv4(),
        userId,
        message,
        isRead: false,
        createdAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      warning
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

    // Get unread warnings for user
    const { data: warnings, error } = await supabase
      .from('warnings')
      .select('*')
      .eq('userId', userId)
      .eq('isRead', false)
      .order('createdAt', { ascending: false })

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

    const { error } = await supabase
      .from('warnings')
      .update({ isRead: true })
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

// Ban/Unban User Functions
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

    // Check if user is already banned
    const { data: existingBan } = await supabase
      .from('banned_users')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single()

    if (existingBan) {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      )
    }

    // Create ban record
    const { data: ban, error } = await supabase
      .from('banned_users')
      .insert({
        id: uuidv4(),
        userId,
        reason,
        bannedBy,
        bannedAt: new Date().toISOString(),
        isActive: true
      })
      .select()
      .single()

    if (error) throw error

    // Remove user from online users
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

    // Deactivate ban
    const { error } = await supabase
      .from('banned_users')
      .update({ isActive: false })
      .eq('userId', userId)
      .eq('isActive', true)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handleGetBannedUsers(request) {
  try {
    // Get all active bans with user details
    const { data: bans, error } = await supabase
      .from('banned_users')
      .select('*')
      .eq('isActive', true)
      .order('bannedAt', { ascending: false })

    if (error) throw error

    // Get user details for each ban
    const bansWithDetails = await Promise.all(
      (bans || []).map(async (ban) => {
        const { data: user } = await supabase
          .from('profiles')
          .select('id, name, email, photo_url, department, year')
          .eq('id', ban.userId)
          .single()

        return {
          ...ban,
          user
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

    // Check if user is banned
    const { data: ban, error } = await supabase
      .from('banned_users')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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

// Main router
export async function GET(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/profiles')) {
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
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/auth/signup')) {
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
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
