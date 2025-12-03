# 🎯 ANURAG CONNECT - Complete Interview Preparation Guide

> **Project**: Campus Dating/Social Platform for Anurag University Students  
> **Tech Stack**: Next.js 14, React, Supabase (PostgreSQL + Realtime), Tailwind CSS  
> **Repository**: Manikanta-Goud/anurag_dattes

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [File Structure & Responsibilities](#file-structure--responsibilities)
4. [Key Features Deep Dive](#key-features-deep-dive)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Real-Time Implementation](#real-time-implementation)
8. [State Management](#state-management)
9. [Security & Authentication](#security--authentication)
10. [Performance Optimizations](#performance-optimizations)
11. [Common Interview Questions & Answers](#common-interview-questions--answers)
12. [Challenges & Solutions](#challenges--solutions)
13. [Code Snippets You Should Know](#code-snippets-you-should-know)

---

## 1. PROJECT OVERVIEW

### What is Anurag Connect?
**Answer**: "Anurag Connect is a full-stack campus social platform I built for Anurag University students. It's similar to a combination of Tinder and Instagram - users can discover profiles with a swipe interface, send friend requests that appear in real-time notifications, chat with matched friends, and participate in campus events. The platform also includes a leaderboard system, admin panel for moderation, and event management."

### Key Statistics
- **5,056 lines** in main frontend file (app/page.js)
- **2,085 lines** in backend API (app/api/[[...path]]/route.js)
- **10+ database tables** with real-time subscriptions
- **30+ API endpoints** covering all features
- **Real-time messaging** and friend request notifications
- **Mobile-responsive** with touch gestures

---

## 2. TECHNICAL ARCHITECTURE

### Tech Stack Justification

**Q: Why Next.js?**
```
✅ Server-side rendering for better SEO
✅ API routes built-in (no separate backend needed)
✅ File-based routing (automatic routing)
✅ Great performance with React 18 features
✅ Easy deployment on Vercel
```

**Q: Why Supabase?**
```
✅ PostgreSQL database (relational data)
✅ Built-in real-time subscriptions (WebSocket)
✅ Row-level security (RLS) for data protection
✅ File storage for profile photos
✅ No need for separate WebSocket server
✅ Free tier suitable for MVP
```

**Q: Why Tailwind CSS?**
```
✅ Utility-first approach (faster development)
✅ No CSS conflicts (scoped classes)
✅ Built-in responsive design utilities
✅ Easy to customize with theme config
✅ Smaller bundle size (purged unused CSS)
```

### Architecture Pattern
```
┌─────────────────────────────────────────────┐
│           CLIENT (Browser)                  │
│  ┌─────────────────────────────────────┐   │
│  │   React Components (app/page.js)    │   │
│  │   - State Management (useState)      │   │
│  │   - Side Effects (useEffect)         │   │
│  │   - Real-time Subscriptions          │   │
│  └─────────────┬───────────────────────┘   │
└────────────────┼─────────────────────────────┘
                 │ HTTP/HTTPS
                 │ WebSocket (Realtime)
┌────────────────▼─────────────────────────────┐
│       NEXT.JS SERVER (Vercel)                │
│  ┌─────────────────────────────────────┐    │
│  │  API Routes (route.js)              │    │
│  │  - handleLogin/Signup               │    │
│  │  - handleSendFriendRequest          │    │
│  │  - handleGetMessages                │    │
│  │  - 30+ more endpoints               │    │
│  └─────────────┬───────────────────────┘    │
└────────────────┼──────────────────────────────┘
                 │ PostgreSQL Protocol
                 │ Supabase JS Client
┌────────────────▼──────────────────────────────┐
│         SUPABASE (Backend)                    │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL DB   │  │  Storage Bucket  │  │
│  │  - profiles      │  │  - profile-photos│  │
│  │  - messages      │  │                  │  │
│  │  - matches       │  │                  │  │
│  │  - 10+ tables    │  │                  │  │
│  └──────────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────┐    │
│  │     Realtime Engine (WebSocket)      │    │
│  │  - friend_requests subscription      │    │
│  │  - messages subscription             │    │
│  └──────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

---

## 3. FILE STRUCTURE & RESPONSIBILITIES

### Directory Tree
```
anurag_dattes/
├── app/
│   ├── page.js                    (5,056 lines - Main App Component)
│   ├── layout.js                  (Root layout with Toaster)
│   ├── globals.css                (Tailwind + Custom animations)
│   ├── api/
│   │   └── [[...path]]/
│   │       └── route.js           (2,085 lines - All API endpoints)
│   └── admin/
│       └── page.js                (Admin panel - not shown in tree)
│
├── components/
│   └── ui/                        (40+ shadcn/ui components)
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── avatar.jsx
│       └── ... (35+ more)
│
├── lib/
│   ├── supabase.js                (Supabase client initialization)
│   └── utils.js                   (Helper functions)
│
├── hooks/
│   ├── use-mobile.jsx             (Mobile detection hook)
│   └── use-toast.js               (Toast notification hook)
│
├── SQL Scripts/
│   ├── create-events-table.sql
│   ├── add-leaderboard-columns.sql
│   ├── fix-friend-requests-rls.sql
│   └── setup-storage-bucket.sql
│
└── Documentation/
    ├── ADMIN_GUIDE.md
    ├── EVENTS_MANAGEMENT_GUIDE.md
    ├── INSTAGRAM_STYLE_FRIEND_REQUESTS.md
    └── ... (10+ docs)
```

### Key Files Explained

#### **app/page.js** (5,056 lines)
**Purpose**: Main application logic and UI  
**Contains**:
- 20+ useState hooks for state management
- 15+ useEffect hooks for lifecycle management
- All view components (Landing, Auth, Profile, Main, Events)
- Real-time subscription logic
- Event handlers for all user interactions

**Interview Talking Points**:
- "I organized everything in a single file initially for rapid development"
- "Used conditional rendering based on view state to switch between pages"
- "Implemented custom hooks for repeated logic (typing detection, scroll tracking)"

#### **app/api/[[...path]]/route.js** (2,085 lines)
**Purpose**: Backend API - handles all HTTP requests  
**Contains**:
- 30+ request handlers (handleLogin, handleSendFriendRequest, etc.)
- Database queries using Supabase client
- Authentication & authorization logic
- In-memory online users tracking

**Interview Talking Points**:
- "Used Next.js catch-all routes for flexible API structure"
- "Each handler follows same pattern: validate → query DB → return response"
- "Implemented simple password hashing (acknowledged as improvement area)"

#### **lib/supabase.js** (7 lines)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```
**Why it matters**: Single source of truth for database connection

---

## 4. KEY FEATURES DEEP DIVE

### Feature 1: Instagram-Style Friend Requests

**How it works**:
```
1. User A browses profiles (Discover tab)
2. Clicks "Send Request" → POST /api/friend-request/send
3. Server: INSERT into friend_requests (status: pending)
4. User B's device receives real-time notification via Supabase Realtime
5. Notification appears in bell icon (notification bar)
6. User B clicks "Accept" → POST /api/friend-request/accept
7. Server: UPDATE friend_requests + INSERT into matches
8. Both users now see each other in Friends tab
```

**Code Flow**:
```javascript
// Frontend (app/page.js)
const sendFriendRequest = async (receiverId) => {
  const response = await fetch('/api/friend-request/send', {
    method: 'POST',
    body: JSON.stringify({ senderId: currentUser.id, receiverId })
  })
  if (response.ok) {
    toast.success('Request sent!')
    setLikedProfiles(prev => new Set(prev).add(receiverId))
  }
}

// Backend (route.js)
async function handleSendFriendRequest(request) {
  const { senderId, receiverId } = await request.json()
  
  // Check if already matched
  const { data: existingMatch } = await supabase
    .from('matches')
    .select('id')
    .or(`and(user1Id.eq.${senderId},user2Id.eq.${receiverId})...`)
    .single()
  
  if (existingMatch) return error('Already friends')
  
  // Insert pending request (NO auto-match)
  await supabase.from('friend_requests').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending'
  })
  
  return { success: true }
}

// Real-time subscription (app/page.js)
useEffect(() => {
  const channel = supabase
    .channel(`friend-requests-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'friend_requests',
      filter: `receiver_id=eq.${currentUser.id}`
    }, async (payload) => {
      // Fetch sender profile
      const senderProfile = await fetchProfile(payload.new.sender_id)
      
      // Add to state
      setFriendRequests(prev => [newRequest, ...prev])
      
      // Show toast
      toast.success(`${senderProfile.name} sent you a friend request!`)
    })
    .subscribe()
  
  return () => supabase.removeChannel(channel)
}, [currentUser])
```

**Interview Questions**:
- **Q: Why not auto-match like Tinder?**
  - "User wanted Instagram-style flow where requests must be manually accepted. This gives users more control and reduces unwanted connections."

- **Q: How do you prevent duplicate requests?**
  - "Before inserting, I check if a pending request already exists between these two users."

- **Q: What if the real-time connection fails?**
  - "Initially had polling fallback every 5 seconds, but removed it to keep the system simpler. Users can refresh the page to load pending requests."

### Feature 2: Real-Time Chat

**How it works**:
```
1. User selects friend from Friends tab
2. GET /api/messages?matchId=X → Load chat history
3. Subscribe to Supabase Realtime (messages table, filter by matchId)
4. User types and sends message → POST /api/messages
5. Server: INSERT into messages table
6. Supabase triggers INSERT event to all subscribers
7. Message appears instantly on both screens
8. Auto-scroll if user is at bottom
```

**Critical Challenge Solved**: Message Cross-Contamination
```javascript
// Problem: When switching chats quickly, messages from old chat 
// would appear in new chat due to stale closures

// Solution: Used useRef to track current match
const currentMatchIdRef = useRef(null)

useEffect(() => {
  if (selectedMatch) {
    // Update ref immediately
    currentMatchIdRef.current = selectedMatch.id
    
    // Subscribe with validation
    const channel = supabase
      .channel(`match-${selectedMatch.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        table: 'messages',
        filter: `matchId=eq.${selectedMatch.id}`
      }, (payload) => {
        // Validate message belongs to CURRENT match (not old one)
        if (payload.new.matchId !== currentMatchIdRef.current) {
          console.log('Message for old chat, ignoring')
          return
        }
        
        // Add message
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
      if (currentMatchIdRef.current === selectedMatch.id) {
        currentMatchIdRef.current = null
      }
    }
  }
}, [selectedMatch])
```

**Interview Questions**:
- **Q: How do you handle message ordering?**
  - "Messages are stored with createdAt timestamp. I query with ORDER BY createdAt ASC to maintain chronological order."

- **Q: What about message delivery confirmation?**
  - "Currently not implemented. Would add a 'status' field (sent/delivered/read) and update on client acknowledgment."

- **Q: How do you handle large message history?**
  - "Currently loading all messages for a match. For scale, would implement pagination with offset/limit and lazy loading."

### Feature 3: Leaderboard System

**How it works**:
```
profiles table columns:
- total_likes (INT) - all-time likes
- daily_likes (INT) - resets daily
- weekly_likes (INT) - resets weekly

When someone likes a profile:
1. POST /api/increment-like
2. UPDATE profiles SET 
   total_likes = total_likes + 1,
   daily_likes = daily_likes + 1,
   weekly_likes = weekly_likes + 1
3. Leaderboard queries ORDER BY daily_likes|weekly_likes|total_likes DESC
```

**Interview Questions**:
- **Q: How do you reset daily/weekly counters?**
  - "Currently manual. In production, would use Supabase scheduled functions or cron jobs to reset at midnight/week start."

- **Q: What if two users have same like count?**
  - "PostgreSQL returns in arbitrary order. Would add secondary sort by createdAt (older accounts rank higher) or profile_views."

---

## 5. DATABASE SCHEMA

### Tables Overview

```sql
-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- Base64 encoded (⚠️ not bcrypt)
  name TEXT,
  bio TEXT,
  department TEXT,
  year TEXT,
  interests TEXT[],  -- Array of strings
  photo_url TEXT,
  total_likes INT DEFAULT 0,
  daily_likes INT DEFAULT 0,
  weekly_likes INT DEFAULT 0,
  profile_views INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Friend Requests (Realtime enabled)
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Matches (Friends)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1Id UUID REFERENCES profiles(id),
  user2Id UUID REFERENCES profiles(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1Id, user2Id)  -- Prevent duplicate friendships
);

-- Messages (Realtime enabled)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matchId UUID REFERENCES matches(id) ON DELETE CASCADE,
  senderId UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Likes (for discovery swipes)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fromUserId UUID REFERENCES profiles(id),
  toUserId UUID REFERENCES profiles(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(fromUserId, toUserId)
);

-- Blocked Users
CREATE TABLE blocked_users (
  blocker_id UUID REFERENCES profiles(id),
  blocked_id UUID REFERENCES profiles(id),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Admin Warnings
CREATE TABLE warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Banned Users
CREATE TABLE banned_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userid UUID REFERENCES profiles(id),
  reason TEXT,
  bannedby TEXT,
  bannedat TIMESTAMP DEFAULT NOW(),
  isactive BOOLEAN DEFAULT TRUE
);

-- Campus Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  venue TEXT,
  club_name TEXT,
  organizer TEXT,
  guests TEXT,
  category TEXT CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition')),
  status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  image_url TEXT,
  max_capacity INT,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_link TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row-Level Security (RLS) Policies

```sql
-- friend_requests table RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (true);  -- Anyone can send (validated in app logic)

CREATE POLICY "Allow users to view their requests"
  ON friend_requests FOR SELECT
  USING (true);  -- Anyone can view (app filters by user)

CREATE POLICY "Allow users to update requests"
  ON friend_requests FOR UPDATE
  USING (true);

CREATE POLICY "Allow users to delete requests"
  ON friend_requests FOR DELETE
  USING (true);
```

**Interview Q**: Why `WITH CHECK (true)` instead of specific user checks?
**Answer**: "I validated permissions in application code for faster development. In production, would add specific checks like `auth.uid() = sender_id` for better security."

---

## 6. API ENDPOINTS

### Complete API Reference

```
📍 AUTHENTICATION
├── POST   /api/auth/signup           - Create new account
├── POST   /api/auth/login            - Login with credentials
└── POST   /api/auth/admin-login      - Admin panel access

📍 PROFILES
├── GET    /api/profiles?userId=X     - Get all profiles except current user
└── POST   /api/profiles              - Update user profile

📍 FRIEND REQUESTS
├── POST   /api/friend-request/send           - Send friend request
├── GET    /api/friend-request/pending?userId=X  - Get incoming requests
├── GET    /api/friend-request/sent?userId=X     - Get sent requests
├── POST   /api/friend-request/accept         - Accept request → create match
└── POST   /api/friend-request/reject         - Reject request

📍 MATCHES & MESSAGING
├── GET    /api/matches?userId=X       - Get all friends with block status
├── GET    /api/messages?matchId=X    - Get chat history
├── POST   /api/messages              - Send new message
└── POST   /api/remove-friend         - Unfriend user

📍 LIKES
├── POST   /api/likes                 - Like a profile (old system)
├── GET    /api/likes?userId=X        - Get user's likes
├── POST   /api/increment-like        - Increment like counters
└── POST   /api/decrement-like        - Decrement like counters

📍 BLOCKING
├── POST   /api/block-user            - Block user (keeps match)
├── POST   /api/unblock-user          - Unblock user
└── GET    /api/blocked-users?userId=X - Get blocked user IDs

📍 LEADERBOARD
├── GET    /api/leaderboard?type=daily&limit=20  - Get top profiles
├── GET    /api/trending?limit=10                - Get trending today
└── POST   /api/increment-view                   - Track profile views

📍 ONLINE STATUS
├── POST   /api/online                - Update last seen (in-memory Map)
└── GET    /api/online                - Get online user IDs

📍 EVENTS
├── GET    /api/events?status=upcoming     - Get events by status
├── POST   /api/events/create             - Create new event (admin)
├── POST   /api/events/update             - Update event
└── DELETE /api/events/delete?eventId=X   - Delete event

📍 WARNINGS & MODERATION
├── GET    /api/warnings?userId=X          - Get unread warnings
├── POST   /api/warnings/mark-read         - Mark warning as read
├── POST   /api/admin/send-warning         - Send warning (auto-ban at 5)
├── POST   /api/admin/ban-user             - Ban user account
├── POST   /api/admin/unban-user           - Unban user
├── GET    /api/admin/banned-users         - Get all banned users
├── GET    /api/ban-status?userId=X        - Check if user is banned
└── POST   /api/admin/delete-user          - Permanently delete account

📍 ADMIN PANEL
├── GET    /api/admin/users?sortBy=createdAt    - Get all users with stats
├── GET    /api/admin/conversations             - Get all chat conversations
└── GET    /api/admin/stats                     - Get platform statistics
```

---

## 7. REAL-TIME IMPLEMENTATION

### How Supabase Realtime Works

```javascript
// 1. Enable Realtime on Table (SQL)
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

// 2. Subscribe to Changes (Client)
const channel = supabase
  .channel('unique-channel-name')
  .on(
    'postgres_changes',  // Event type
    {
      event: 'INSERT',        // INSERT | UPDATE | DELETE | *
      schema: 'public',       // Database schema
      table: 'messages',      // Table name
      filter: 'matchId=eq.123'  // Optional filter (WHERE clause)
    },
    (payload) => {
      // Callback when change detected
      console.log('New message:', payload.new)
      setMessages(prev => [...prev, payload.new])
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') console.log('Connected!')
  })

// 3. Cleanup
return () => supabase.removeChannel(channel)
```

### Common Pitfalls & Solutions

**Problem 1**: Multiple subscriptions on same table
```javascript
// ❌ Bad: Creates duplicate subscriptions
useEffect(() => {
  subscribeToMessages()
}, [selectedMatch])  // Re-runs on every match change

// ✅ Good: Clean up old subscription first
useEffect(() => {
  supabase.getChannels().forEach(ch => supabase.removeChannel(ch))
  subscribeToMessages()
  return () => cleanup()
}, [selectedMatch])
```

**Problem 2**: Stale closure in callback
```javascript
// ❌ Bad: selectedMatch is stale in callback
const channel = supabase.on('INSERT', (payload) => {
  if (payload.matchId === selectedMatch.id) { /* selectedMatch is old! */ }
})

// ✅ Good: Use ref for latest value
const matchRef = useRef(selectedMatch.id)
const channel = supabase.on('INSERT', (payload) => {
  if (payload.matchId === matchRef.current) { /* Always current! */ }
})
```

---

## 8. STATE MANAGEMENT

### useState Hooks (20+ in app/page.js)

```javascript
// User & Auth State
const [currentUser, setCurrentUser] = useState(null)
const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
const [profileForm, setProfileForm] = useState({ /* profile fields */ })

// Navigation State
const [view, setView] = useState('landing')  // landing|auth|profile-setup|main|profile
const [mainNav, setMainNav] = useState('home')  // home|events
const [activeTab, setActiveTab] = useState('discover')  // discover|leaderboard|search|matches|blocked

// Social State
const [profiles, setProfiles] = useState([])  // All profiles for discovery
const [matches, setMatches] = useState([])  // Friends list
const [friendRequests, setFriendRequests] = useState([])  // Incoming requests
const [likedProfiles, setLikedProfiles] = useState(new Set())  // Profile IDs user liked
const [blockedUsers, setBlockedUsers] = useState(new Set())  // Blocked IDs
const [blockedUsersList, setBlockedUsersList] = useState([])  // Full profiles

// Chat State
const [selectedMatch, setSelectedMatch] = useState(null)  // Current chat
const [messages, setMessages] = useState([])  // Chat history
const [messageInput, setMessageInput] = useState('')
const [unreadMessages, setUnreadMessages] = useState(new Set())  // Match IDs
const [isTyping, setIsTyping] = useState(false)

// Modal State
const [showProfileModal, setShowProfileModal] = useState(false)
const [selectedProfile, setSelectedProfile] = useState(null)
const [showNotifications, setShowNotifications] = useState(false)
const [showHelpModal, setShowHelpModal] = useState(false)

// Events State
const [events, setEvents] = useState([])
const [selectedEvent, setSelectedEvent] = useState(null)

// Leaderboard State
const [leaderboardData, setLeaderboardData] = useState([])
const [leaderboardType, setLeaderboardType] = useState('daily')

// Search State
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState([])

// UI State
const [loading, setLoading] = useState(false)
const [uploadingPhoto, setUploadingPhoto] = useState(false)
const [isDragging, setIsDragging] = useState(false)
```

**Interview Q**: Why not use Redux/Context API?
**Answer**: "For an MVP with single-component structure, useState was sufficient. If scaling, would extract chat and social features into contexts to avoid prop drilling and improve performance with memo/useMemo."

---

## 9. SECURITY & AUTHENTICATION

### Current Implementation

```javascript
// Simple Base64 encoding (NOT cryptographically secure)
function hashPassword(password) {
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}
```

**Interview Q**: What's wrong with this approach?
**Answer**: 
```
⚠️ Problems:
1. Base64 is encoding, not hashing (easily reversible)
2. No salt (same password = same hash)
3. Vulnerable to rainbow table attacks
4. No rate limiting on login attempts

✅ Production Solution:
1. Use bcrypt with salt rounds (10-12)
2. Implement password strength validation
3. Add rate limiting (max 5 attempts per IP per hour)
4. Use JWT tokens with httpOnly cookies
5. Implement refresh token rotation
6. Add 2FA for sensitive actions

Example with bcrypt:
const bcrypt = require('bcrypt')
const saltRounds = 10

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds)
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}
```

### College ID Validation

```javascript
// Format: YYegDDDSRR@anurag.edu.in
// YY = batch year (23, 24, 25)
// eg = fixed letters
// DDD = department code (105=CSE, 206=ECE, etc.)
// S = section (a-z)
// RR = roll number (01-99)

const collegeIdPattern = /^(\d{2})(eg)(\d{3})([a-z])(\d{2})$/i

function validateCollegeId(email) {
  if (!email.endsWith('@anurag.edu.in')) return false
  
  const idPart = email.split('@')[0]
  const match = idPart.match(collegeIdPattern)
  
  if (!match) return false
  
  const [, batchYear, , , , rollNo] = match
  
  // Validate batch year is reasonable
  const currentYear = new Date().getFullYear() % 100
  const batch = parseInt(batchYear)
  if (batch > currentYear || batch < currentYear - 10) return false
  
  // Validate roll number is not 00
  if (parseInt(rollNo) === 0) return false
  
  return true
}
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### Current Optimizations

1. **Conditional Rendering** - Only render active view
```javascript
{view === 'landing' && <LandingPage />}
{view === 'main' && <MainApp />}
```

2. **Lazy Loading Images** - Browser native lazy loading
```javascript
<img src={photoUrl} loading="lazy" />
```

3. **Debounced Search** - Prevent excessive API calls
```javascript
useEffect(() => {
  const debounce = setTimeout(() => handleSearch(), 500)
  return () => clearTimeout(debounce)
}, [searchQuery])
```

4. **Realtime Subscription Cleanup** - Prevent memory leaks
```javascript
useEffect(() => {
  const channel = subscribeToMessages()
  return () => supabase.removeChannel(channel)
}, [])
```

5. **Smart Auto-Scroll** - Only scroll if user at bottom
```javascript
const isNearBottom = 
  container.scrollHeight - container.scrollTop - container.clientHeight < 100

if (isNearBottom) container.scrollTop = container.scrollHeight
```

### Potential Improvements

```
🚀 Frontend:
├── Code splitting with React.lazy()
├── Memoization with useMemo/useCallback
├── Virtual scrolling for large lists
├── Service Worker for offline support
└── Image optimization with next/image

🚀 Backend:
├── Implement caching (Redis)
├── Add database indexes on foreign keys
├── Use connection pooling
├── Implement rate limiting
└── Add CDN for static assets

🚀 Database:
├── Pagination for large datasets
├── Implement full-text search (PostgreSQL)
├── Archive old messages (move to separate table)
└── Add database backups
```

---

## 11. COMMON INTERVIEW QUESTIONS & ANSWERS

### General Questions

**Q1: Walk me through the project architecture.**
```
Answer: "Anurag Connect is a full-stack Next.js application with three main layers:

1. Frontend (React) - Single page app with 5 main views (landing, auth, profile-setup, 
   main app, and profile). Uses conditional rendering based on view state.

2. API Layer (Next.js API Routes) - 30+ endpoints handling authentication, friend 
   requests, messaging, events, etc. Uses catch-all routing for flexible structure.

3. Database (Supabase/PostgreSQL) - 10 tables with relational data. Key tables are 
   profiles, friend_requests, matches, and messages. Two tables have real-time enabled 
   for instant notifications.

Data flows from React components → API routes → Supabase, and back. For real-time 
features, Supabase pushes changes directly to subscribed clients via WebSocket."
```

**Q2: What was the most challenging feature to implement?**
```
Answer: "The real-time chat system had a critical bug I had to solve. When users 
switched between different conversations quickly, messages from the old chat would 
appear in the new chat. This happened because React closures captured stale values 
of selectedMatch.

Solution: I used useRef to track the current match ID and validated every incoming 
message against currentMatchIdRef.current before adding it to state. I also cleaned 
up all existing Realtime channels before subscribing to a new one.

This taught me about React closure pitfalls and the importance of using refs for 
values that need to be accessed in async callbacks."
```

**Q3: How did you handle user authentication?**
```
Answer: "Currently using simple Base64 encoding for MVP speed, which I acknowledge is 
not production-ready. In production, I would:

1. Use bcrypt with salt for password hashing
2. Implement JWT tokens stored in httpOnly cookies
3. Add refresh token rotation
4. Implement rate limiting on login attempts
5. Add OAuth integration (Google, Microsoft for college accounts)
6. Implement 2FA for admin accounts

I also implemented college ID validation using regex to ensure only Anurag University 
students can sign up."
```

**Q4: How would you scale this application?**
```
Answer: "Several approaches:

Frontend:
- Split monolithic page.js into multiple components
- Implement code splitting with React.lazy()
- Add service workers for offline functionality
- Use virtual scrolling for large lists
- Implement infinite scroll instead of loading all profiles

Backend:
- Add Redis caching for frequently accessed data (profiles, leaderboard)
- Implement database read replicas for query distribution
- Add rate limiting to prevent abuse
- Use message queues (RabbitMQ) for async tasks
- Implement microservices for independent scaling (auth, chat, events)

Database:
- Add pagination (offset/limit) for large datasets
- Implement database sharding by user ID ranges
- Archive old messages to separate tables
- Add full-text search indexes for fast queries
- Implement data retention policies

Infrastructure:
- Use CDN for static assets
- Add load balancer for horizontal scaling
- Implement monitoring (Sentry for errors, Datadog for metrics)
- Add automated backups and disaster recovery
"
```

**Q5: What security measures did you implement?**
```
Answer: "Current security measures:

1. Row-Level Security (RLS) on Supabase tables
2. College ID validation (only @anurag.edu.in emails)
3. Environment variables for sensitive keys
4. Input validation on forms
5. SQL injection prevention (using Supabase parameterized queries)
6. XSS prevention (React escapes by default)

Improvements needed:
1. Replace Base64 with bcrypt password hashing
2. Implement JWT with httpOnly cookies
3. Add CSRF protection
4. Rate limiting on API endpoints
5. Content Security Policy headers
6. Implement audit logs for admin actions
7. Add file upload validation (check file type, scan for malware)
"
```

### Technical Deep Dives

**Q6: Explain the friend request system.**
```
Answer: "It's designed like Instagram's friend request system - manual approval required:

1. User A discovers User B's profile and clicks 'Send Request'
2. Frontend: POST /api/friend-request/send with senderId and receiverId
3. Backend validates: not already friends, no pending request, not blocked
4. INSERT into friend_requests table with status='pending'
5. Supabase Realtime triggers on User B's subscribed channel
6. User B sees notification instantly (within 1-2 seconds)
7. User B clicks Accept → POST /api/friend-request/accept
8. Backend: UPDATE friend_requests SET status='accepted' + INSERT into matches
9. Both users now see each other in Friends tab and can chat

Key difference from auto-matching: Even if both users like each other, they don't 
become friends until one accepts the other's request. This gives users more control."
```

**Q7: How does the real-time messaging work?**
```
Answer: "Uses Supabase Realtime (built on PostgreSQL's LISTEN/NOTIFY):

Setup:
1. Enable realtime on messages table: 
   ALTER PUBLICATION supabase_realtime ADD TABLE messages

2. Client subscribes to changes:
   supabase.channel('match-123')
     .on('postgres_changes', {
       event: 'INSERT',
       table: 'messages',
       filter: 'matchId=eq.123'
     }, callback)
     .subscribe()

Flow:
1. User A types message and clicks Send
2. POST /api/messages → INSERT into messages table
3. PostgreSQL triggers NOTIFY event
4. Supabase pushes to all subscribed clients via WebSocket
5. User B's callback fires, adds message to state
6. UI updates instantly with new message

Advantages over polling:
- Sub-second latency (vs 3-5 seconds with polling)
- Reduced server load (no constant requests)
- Better battery life on mobile
- Bi-directional communication
"
```

**Q8: How do you prevent message duplication?**
```
Answer: "Multiple safeguards:

1. Check before adding to state:
   setMessages(prev => {
     if (prev.some(msg => msg.id === newMessage.id)) return prev
     return [...prev, newMessage]
   })

2. Validate message belongs to current chat:
   if (newMessage.matchId !== currentMatchIdRef.current) return

3. Cleanup subscriptions properly:
   - Remove all channels before subscribing to new one
   - Unsubscribe in cleanup function
   - Clear ref when match changes

4. Database constraint (not implemented but would add):
   CREATE UNIQUE INDEX ON messages(id)
"
```

**Q9: Explain the state management approach.**
```
Answer: "Used 20+ useState hooks in main component for simplicity during MVP development:

Advantages:
- Fast prototyping
- No boilerplate
- Easy to debug (all state in one place)
- Sufficient for single-component app

Disadvantages:
- Props drilling (passing state down)
- Re-renders can be expensive
- Hard to share state across distant components
- Not suitable for large apps

If scaling, I would:
1. Extract into Context API for shared state (auth, chat)
2. Use React Query for server state (profiles, messages)
3. Consider Zustand/Jotai for complex client state
4. Implement useMemo/useCallback to prevent unnecessary re-renders

Example refactor:
// Create AuthContext
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Use in components
const { currentUser } = useContext(AuthContext)
"
```

**Q10: How do you handle photo uploads?**
```
Answer: "Two-step process:

1. Frontend: Convert to base64 for preview
   const reader = new FileReader()
   reader.onloadend = () => {
     setProfileForm({ ...profileForm, photo_url: reader.result })
   }
   reader.readAsDataURL(file)

2. Backend: Upload to Supabase Storage on save
   - Generate unique filename: profile_{userId}_{timestamp}_{random}.jpg
   - Upload to 'profile-photos' bucket
   - Get public URL
   - Save URL to database

Validations:
- File type check (must be image/*)
- Size limit (max 5MB)
- Dimension validation (could add min/max width/height)

Improvements:
- Client-side image compression before upload
- Generate thumbnails (small, medium, large)
- Lazy loading with blur placeholder
- Implement cropping tool
- Add CDN for faster delivery
"
```

---

## 12. CHALLENGES & SOLUTIONS

### Challenge 1: Message Cross-Contamination

**Problem**: When rapidly switching between chats, old messages appeared in new chats.

**Root Cause**: React closure captured stale `selectedMatch` value in Realtime callback.

**Solution**:
```javascript
// Used useRef for mutable reference
const currentMatchIdRef = useRef(null)

useEffect(() => {
  currentMatchIdRef.current = selectedMatch?.id
  
  const channel = supabase.on('INSERT', (payload) => {
    // Validate against ref (always current)
    if (payload.new.matchId !== currentMatchIdRef.current) return
    setMessages(prev => [...prev, payload.new])
  })
  
  return () => {
    supabase.removeChannel(channel)
    if (currentMatchIdRef.current === selectedMatch?.id) {
      currentMatchIdRef.current = null
    }
  }
}, [selectedMatch])
```

### Challenge 2: Friend Requests Not Appearing

**Problem**: Users sent friend requests, but receivers never saw them.

**Root Cause**: 
1. RLS policies blocked inserts to friend_requests table
2. Realtime wasn't enabled on the table

**Solution**:
```sql
-- 1. Add RLS policies
CREATE POLICY "Allow inserts" ON friend_requests FOR INSERT WITH CHECK (true);

-- 2. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

-- 3. Subscribe on frontend
supabase.channel('friend-requests-${userId}')
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'friend_requests',
    filter: `receiver_id=eq.${userId}`
  }, callback)
  .subscribe()
```

### Challenge 3: Chat Auto-Scroll Behavior

**Problem**: Chat would auto-scroll even when user was reading old messages.

**Solution**: Implemented smart scrolling
```javascript
// Track if user is at bottom
const [isUserAtBottom, setIsUserAtBottom] = useState(true)
const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

// Detect scroll position
const handleScroll = (e) => {
  const { scrollHeight, scrollTop, clientHeight } = e.target
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
  setIsUserAtBottom(isAtBottom)
  setShouldAutoScroll(isAtBottom)
}

// Only auto-scroll if at bottom
if (shouldAutoScroll) {
  container.scrollTop = container.scrollHeight
}
```

### Challenge 4: Profile Photo Upload Failures

**Problem**: Photos uploaded but didn't save to profile.

**Root Cause**: Async upload completed after profile update request.

**Solution**: Wait for upload before updating profile
```javascript
const handleProfileSetup = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  // Upload photo FIRST if it's base64
  let finalPhotoUrl = profileForm.photo_url
  if (profileForm.photo_url && !profileForm.photo_url.startsWith('http')) {
    finalPhotoUrl = await uploadPhotoToServer(profileForm.photo_url)
    if (!finalPhotoUrl) {
      setLoading(false)
      return // Don't proceed if upload fails
    }
  }
  
  // THEN update profile with uploaded URL
  await fetch('/api/profiles', {
    method: 'POST',
    body: JSON.stringify({ ...profileForm, photo_url: finalPhotoUrl })
  })
  
  setLoading(false)
}
```

---

## 13. CODE SNIPPETS YOU SHOULD KNOW

### Essential Patterns

#### 1. API Request Handler Pattern
```javascript
async function handleGetProfiles(request) {
  try {
    // 1. Extract parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // 2. Validate
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    // 3. Query database
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
    
    // 4. Handle errors
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // 5. Return success response
    return NextResponse.json({ profiles: data || [] })
    
  } catch (error) {
    console.error('Handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### 2. Realtime Subscription Pattern
```javascript
useEffect(() => {
  if (!currentUser) return
  
  console.log('🔌 Subscribing to real-time updates')
  
  // Cleanup old subscriptions
  supabase.getChannels().forEach(ch => supabase.removeChannel(ch))
  
  // Create new subscription
  const channel = supabase
    .channel(`unique-${currentUser.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'friend_requests',
      filter: `receiver_id=eq.${currentUser.id}`
    }, (payload) => {
      console.log('⚡ New data received:', payload.new)
      setState(prev => [...prev, payload.new])
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('✅ Connected')
      if (status === 'CHANNEL_ERROR') console.error('❌ Connection failed')
    })
  
  // Cleanup on unmount
  return () => {
    console.log('🔌 Unsubscribing')
    supabase.removeChannel(channel)
  }
}, [currentUser])
```

#### 3. Debounced Search Pattern
```javascript
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState([])

useEffect(() => {
  if (!searchQuery.trim()) {
    setSearchResults([])
    return
  }
  
  // Debounce: wait 500ms after user stops typing
  const debounceTimer = setTimeout(() => {
    console.log('🔍 Searching for:', searchQuery)
    handleSearch()
  }, 500)
  
  return () => clearTimeout(debounceTimer)
}, [searchQuery])

const handleSearch = async () => {
  const results = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  setSearchResults(results)
}
```

#### 4. Conditional Rendering Pattern
```javascript
export default function App() {
  const [view, setView] = useState('landing')
  
  return (
    <div>
      {view === 'landing' && <LandingPage />}
      {view === 'auth' && <AuthPage />}
      {view === 'main' && <MainApp />}
      {view === 'profile' && <ProfilePage />}
    </div>
  )
}
```

#### 5. Form Handling Pattern
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: ''
})

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
}

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      toast.success('Success!')
    } else {
      toast.error(data.error)
    }
  } catch (error) {
    toast.error('Something went wrong')
  } finally {
    setLoading(false)
  }
}
```

---

## 🎓 INTERVIEW PREPARATION CHECKLIST

### Before the Interview

- [ ] Run the application locally
- [ ] Test all major features (signup, login, friend requests, chat, events)
- [ ] Review database schema
- [ ] Understand real-time implementation
- [ ] Know API endpoints by heart
- [ ] Be ready to explain architectural decisions
- [ ] Prepare improvement ideas
- [ ] Know your challenges and solutions

### During the Interview

**Opening Statement Template**:
> "Anurag Connect is a full-stack campus social platform I built using Next.js, React, and Supabase. It's like a combination of Tinder and Instagram - students can discover profiles with swipe gestures, send friend requests that appear in real-time notifications, chat with friends, and browse campus events. The most challenging part was implementing real-time messaging where I had to solve message cross-contamination when users switched chats quickly. I used React useRef to track the current conversation and validate incoming messages. The project has 7,000+ lines of code, 10+ database tables, and handles everything from authentication to real-time subscriptions."

**When Asked About Specific Features**:
1. Start with user perspective (what user sees)
2. Explain the flow (frontend → API → database)
3. Mention technical decisions and why
4. Share challenges you faced
5. Discuss improvements you'd make

**When You Don't Know**:
- "That's a great question. I haven't implemented that yet, but here's how I would approach it..."
- "In my current implementation, I did X, but I understand Y would be better for production because..."

### Red Flags to Avoid

❌ "I just followed a tutorial"
✅ "I built this from scratch and here's why I made these decisions..."

❌ "I don't know, I just copied from Stack Overflow"
✅ "I researched best practices and decided to use X because..."

❌ "It just works, I don't know how"
✅ "Let me explain the architecture: frontend, API layer, database..."

---

## 📚 ADDITIONAL RESOURCES

### Technologies to Understand Deeply

1. **Next.js**
   - App Router vs Pages Router
   - Server components vs Client components
   - API Routes
   - File-based routing

2. **React**
   - Hooks (useState, useEffect, useRef, useCallback, useMemo)
   - Component lifecycle
   - Closures and why useRef matters
   - Performance optimization

3. **Supabase**
   - PostgreSQL basics
   - Row-Level Security (RLS)
   - Realtime (LISTEN/NOTIFY)
   - Storage buckets
   - Database triggers

4. **WebSockets**
   - How real-time communication works
   - Polling vs WebSocket vs Server-Sent Events
   - Connection management
   - Reconnection strategies

### Questions to Prepare For

- "Walk me through a feature from start to finish"
- "How would you scale this to 10,000 users?"
- "What security vulnerabilities exist?"
- "How do you handle errors?"
- "What would you do differently?"
- "How do you test this?"
- "What metrics would you track?"

---

## 🚀 FINAL TIPS

1. **Be Honest**: If you don't know something, say it and explain how you'd figure it out

2. **Show Growth Mindset**: Acknowledge what's not perfect and how you'd improve it

3. **Use Technical Terms Correctly**: Don't say "API" when you mean "endpoint"

4. **Think Out Loud**: Interviewers want to see your problem-solving process

5. **Relate to Real World**: "This is like how Instagram handles..." shows broader knowledge

6. **Have Examples Ready**: "For example, when a user sends a friend request..."

7. **Know Your Numbers**: 7,000+ lines of code, 10 tables, 30+ endpoints, 2-second real-time latency

8. **Practice Explaining**: Record yourself explaining features - it helps!

---

**Good luck with your interviews! 🎉**

*Remember: You built this entire project from scratch. That's impressive. Own it!*
