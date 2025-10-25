import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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

    // Get IDs of users current user has already liked
    const { data: likedUsers } = await supabase
      .from('likes')
      .select('toUserId')
      .eq('fromUserId', userId)

    const likedUserIds = likedUsers ? likedUsers.map(l => l.toUserId) : []

    // Get all profiles except current user and already liked users
    let query = supabase
      .from('profiles')
      .select('id, name, bio, department, year, interests, photo_url, email')
      .neq('id', userId)

    if (likedUserIds.length > 0) {
      query = query.not('id', 'in', `(${likedUserIds.join(',')})`)
    }

    const { data: profiles, error } = await query.limit(20)

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

// Main router
export async function GET(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/profiles')) {
    return handleGetProfiles(request)
  } else if (pathname.includes('/api/matches')) {
    return handleGetMatches(request)
  } else if (pathname.includes('/api/messages')) {
    return handleGetMessages(request)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request) {
  const pathname = new URL(request.url).pathname

  if (pathname.includes('/api/auth/signup')) {
    return handleSignup(request)
  } else if (pathname.includes('/api/auth/login')) {
    return handleLogin(request)
  } else if (pathname.includes('/api/profiles')) {
    return handleUpdateProfile(request)
  } else if (pathname.includes('/api/likes')) {
    return handleLike(request)
  } else if (pathname.includes('/api/messages')) {
    return handleSendMessage(request)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
