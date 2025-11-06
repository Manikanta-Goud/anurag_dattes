'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, User, LogOut, X, Send, Sparkles, Users, Mail, Bell, AlertTriangle, Search, Eye, UserX, CheckCircle, XCircle, UserPlus, UserMinus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('landing') // landing, auth, profile-setup, main, profile, welcome
  const [authMode, setAuthMode] = useState('login') // login, signup
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true) // Show welcome screen after login
  const [profiles, setProfiles] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false) // Track if mobile chat page is open
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [likedProfiles, setLikedProfiles] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(new Set()) // Track which friends have unread messages
  const [warnings, setWarnings] = useState([]) // Store warnings
  const [unreadWarningsCount, setUnreadWarningsCount] = useState(0) // Count of unread warnings
  const [showNotifications, setShowNotifications] = useState(false) // Toggle notification modal
  const [showHelpModal, setShowHelpModal] = useState(false) // Toggle help modal
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Friend requests state
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState(new Set())
  const [friendRequests, setFriendRequests] = useState([])
  
  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState(new Set())
  const [blockedUsersList, setBlockedUsersList] = useState([]) // Full profile data

  // Scroll tracking state
  const [isUserAtBottom, setIsUserAtBottom] = useState(true) // Track if user is scrolled to bottom
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true) // Control auto-scroll behavior

  // Auth form state
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  })

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    department: '',
    year: '',
    interests: '',
    photo_url: ''
  })

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser')
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (user) {
      setCurrentUser(JSON.parse(user))
      setView('main')
      // Show welcome screen only if user hasn't seen it in this session
      setShowWelcomeScreen(!hasSeenWelcome)
      loadProfiles(JSON.parse(user).id)
      loadMatches(JSON.parse(user).id)
      loadFriendRequests(JSON.parse(user).id)
      loadBlockedUsers(JSON.parse(user).id)
    }
  }, [])

  useEffect(() => {
    if (selectedMatch) {
      setShouldAutoScroll(true) // Enable auto-scroll when opening a chat
      loadMessages(selectedMatch.id, true) // Force scroll on initial load
      
      // Subscribe to real-time message updates using Supabase Realtime
      console.log('🔌 Subscribing to Realtime for match:', selectedMatch.id)
      
      const channel = supabase
        .channel(`match-${selectedMatch.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `matchId=eq.${selectedMatch.id}`
        }, (payload) => {
          console.log('⚡ REALTIME MESSAGE RECEIVED:', payload.new)
          // New message arrives - add it instantly!
          const newMessage = payload.new
          
          // CRITICAL: Only add message if it belongs to the CURRENT selected match
          // This prevents messages from jumping between chats
          if (newMessage.matchId !== selectedMatch.id) {
            console.log('⚠️ Message belongs to different match, ignoring:', newMessage.matchId)
            return
          }
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
          
          // Update match's last message time for sorting
          setMatches(prevMatches => {
            return prevMatches.map(match => {
              if (match.id === selectedMatch.id) {
                return { ...match, lastMessageTime: newMessage.createdAt }
              }
              return match
            })
          })
          
          // Auto-scroll if at bottom
          if (shouldAutoScroll) {
            setTimeout(() => {
              const chatContainer = document.getElementById('chat-messages')
              const mobileChatContainer = document.getElementById('mobile-chat-messages')
              if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
              if (mobileChatContainer) mobileChatContainer.scrollTop = mobileChatContainer.scrollHeight
            }, 50)
          }
        })
        .subscribe((status) => {
          console.log('📡 Realtime subscription status:', status)
          
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('❌ Realtime subscription failed! Check Supabase Dashboard → Database → Replication')
            toast.error('Realtime not enabled. Messages will have 2-3 sec delay.')
          } else if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime connected! Messages will be instant.')
          }
        })
      
      // Fallback polling if Realtime doesn't work (safety net)
      const pollInterval = setInterval(() => {
        console.log('🔄 Fallback polling (Realtime should handle this)')
        loadMessages(selectedMatch.id, false)
      }, 3000) // Poll every 3 seconds as backup
      
      return () => {
        console.log('🔌 Unsubscribing from Realtime')
        supabase.removeChannel(channel)
        clearInterval(pollInterval)
      }
    }
  }, [selectedMatch, shouldAutoScroll])

  // Add scroll listeners to detect when user is scrolling
  useEffect(() => {
    const handleScroll = (e) => {
      const container = e.target
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setIsUserAtBottom(isAtBottom)
      setShouldAutoScroll(isAtBottom)
    }

    const chatContainer = document.getElementById('chat-messages')
    const mobileChatContainer = document.getElementById('mobile-chat-messages')

    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll)
    }
    if (mobileChatContainer) {
      mobileChatContainer.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll)
      }
      if (mobileChatContainer) {
        mobileChatContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [selectedMatch, isMobileChatOpen])

  useEffect(() => {
    // Check for unread messages from all friends
    const checkUnreadMessages = async () => {
      if (!currentUser || !matches.length) return
      
      for (const match of matches) {
        // Skip the currently selected match (it's already marked as read)
        if (selectedMatch?.id === match.id) continue
        
        try {
          const response = await fetch(`/api/messages?matchId=${match.id}`)
          const data = await response.json()
          if (response.ok && data.messages && data.messages.length > 0) {
            // Check if there are any messages from the friend (not from current user)
            const hasNewMessages = data.messages.some(
              msg => msg.senderId === match.matchedUser?.id && 
              msg.createdAt > (localStorage.getItem(`lastRead_${match.id}`) || 0)
            )
            
            if (hasNewMessages) {
              setUnreadMessages(prev => new Set(prev).add(match.id))
            }
          }
        } catch (error) {
          console.error('Failed to check messages:', error)
        }
      }
    }
    
    if (matches.length > 0) {
      checkUnreadMessages()
      // Check every 3 seconds for new messages
      const interval = setInterval(checkUnreadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [matches, currentUser, selectedMatch])

  // Check for warnings when user logs in
  useEffect(() => {
    const checkWarnings = async () => {
      if (!currentUser) return
      
      try {
        const response = await fetch(`/api/warnings?userId=${currentUser.id}`)
        const data = await response.json()
        
        if (response.ok && data.warnings && data.warnings.length > 0) {
          // Store warnings in state
          setWarnings(data.warnings)
          setUnreadWarningsCount(data.warnings.length)
          
          // Show toast notification for new warnings
          toast.error(`You have ${data.warnings.length} new warning(s) from admin`, {
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => setShowNotifications(true)
            }
          })
        }
      } catch (error) {
        console.error('Failed to check warnings:', error)
      }
    }
    
    if (currentUser && view === 'main') {
      checkWarnings()
      // Check for new warnings every 30 seconds
      const interval = setInterval(checkWarnings, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser, view])

  async function markWarningAsRead(warningId) {
    try {
      await fetch('/api/warnings/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warningId })
      })
      
      // Remove from warnings list and update count
      setWarnings(prev => prev.filter(w => w.id !== warningId))
      setUnreadWarningsCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark warning as read:', error)
    }
  }

  useEffect(() => {
    // Update online status every 30 seconds
    if (currentUser && view === 'main') {
      updateOnlineStatus()
      const interval = setInterval(updateOnlineStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser, view])

  useEffect(() => {
    // Load online users every 10 seconds
    if (view === 'main') {
      loadOnlineUsers()
      const interval = setInterval(loadOnlineUsers, 10000)
      return () => clearInterval(interval)
    }
  }, [view])

  useEffect(() => {
    // Keyboard shortcuts for swiping
    const handleKeyDown = (e) => {
      if (view === 'main' && currentProfileIndex < profiles.length) {
        if (e.key === 'ArrowLeft') {
          handleSwipeLeft()
        } else if (e.key === 'ArrowRight') {
          handleSwipeRight()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, currentProfileIndex, profiles])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate College ID Format
      const validateCollegeId = (email) => {
        // Must end with @anurag.edu.in
        if (!email.endsWith('@anurag.edu.in')) {
          return {
            valid: false,
            message: 'Please login with your college ID: id@anurag.edu.in'
          }
        }

        // Extract ID part (before @)
        const idPart = email.split('@')[0]

        // College ID Format: YYegDDDSRR
        // YY = batch year (2 digits)
        // eg = fixed letters
        // DDD = any 3-digit department code (e.g., 105, 206, 305, 449, 505)
        // S = section (single letter a-z)
        // RR = roll number (2 digits)
        const collegeIdPattern = /^(\d{2})(eg)(\d{3})([a-z])(\d{2})$/i

        const match = idPart.match(collegeIdPattern)

        if (!match) {
          return {
            valid: false,
            message: 'Invalid College ID format! Use format: your_rollnumber@anurag.edu.in'
          }
        }

        const [, batchYear, eg, deptCode, section, rollNo] = match

        // Additional validations
        const currentYear = new Date().getFullYear() % 100 // Last 2 digits of current year
        const batchNum = parseInt(batchYear)

        // Batch year should be reasonable (not more than 10 years old, not future)
        if (batchNum > currentYear || batchNum < currentYear - 10) {
          return {
            valid: false,
            message: `Invalid batch year: ${batchYear}. Must be between ${currentYear - 10} and ${currentYear}`
          }
        }

        // Roll number should be 01-99 (not 00)
        if (parseInt(rollNo) === 0) {
          return {
            valid: false,
            message: 'Invalid roll number. Roll number must be between 01 and 99'
          }
        }

        return { valid: true }
      }

      const validation = validateCollegeId(authForm.email)
      if (!validation.valid) {
        toast.error(validation.message, { duration: 5000 })
        setLoading(false)
        return
      }

      if (authMode === 'signup') {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm)
        })

        const data = await response.json()

        if (response.ok) {
          toast.success('Account created! Please complete your profile.')
          setCurrentUser(data.user)
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          setProfileForm({ ...profileForm, name: authForm.name })
          setView('profile-setup')
        } else {
          if (data.error?.includes('already exists') || data.error?.includes('duplicate')) {
            toast.error('⚠️ This email is already registered! Please login instead.', { duration: 5000 })
          } else {
            toast.error(data.error || 'Signup failed')
          }
        }
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email, password: authForm.password })
        })

        const data = await response.json()

        if (response.ok) {
          toast.success('Welcome back!')
          setCurrentUser(data.user)
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          setShowWelcomeScreen(true) // Show welcome screen first
          setView('main')
          loadProfiles(data.user.id)
          loadMatches(data.user.id)
        } else {
          if (data.error?.includes('not found')) {
            toast.error('❌ Account not found! Please signup first.', { duration: 5000 })
          } else {
            toast.error(data.error || 'Login failed')
          }
        }
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }

    setLoading(false)
  }

  const handleProfileSetup = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload photo if it's a base64 preview
      let finalPhotoUrl = profileForm.photo_url
      if (profileForm.photo_url && !profileForm.photo_url.startsWith('http')) {
        toast.loading('Uploading photo...', { id: 'setup-photo' })
        finalPhotoUrl = await uploadPhotoToServer(profileForm.photo_url)
        if (!finalPhotoUrl) {
          setLoading(false)
          toast.error('Failed to upload photo. Please try again.', { id: 'setup-photo' })
          return
        }
        toast.success('Photo uploaded!', { id: 'setup-photo' })
      }

      const interestsArray = profileForm.interests.split(',').map(i => i.trim()).filter(i => i)
      
      toast.loading('Creating profile...', { id: 'setup-profile' })
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...profileForm,
          photo_url: finalPhotoUrl,
          interests: interestsArray
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profile created successfully!', { id: 'setup-profile' })
        setCurrentUser({ ...currentUser, ...data.profile })
        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...data.profile }))
        setView('main')
        loadProfiles(currentUser.id)
      } else {
        toast.error(data.error || 'Failed to create profile', { id: 'setup-profile' })
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }

    setLoading(false)
  }

  const loadProfiles = async (userId) => {
    try {
      const response = await fetch(`/api/profiles?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        // Filter out blocked users
        const filtered = (data.profiles || []).filter(p => !blockedUsers.has(p.id))
        setProfiles(filtered)
        
        // Load user's liked profiles to show request status
        const likesResponse = await fetch(`/api/likes?userId=${userId}`)
        const likesData = await likesResponse.json()
        if (likesResponse.ok) {
          const liked = new Set(likesData.likes?.map(l => l.toUserId) || [])
          setLikedProfiles(liked)
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const loadMatches = async (userId) => {
    try {
      const response = await fetch(`/api/matches?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Failed to load matches:', error)
    }
  }

  const loadMessages = async (matchId, forceScroll = false) => {
    try {
      const response = await fetch(`/api/messages?matchId=${matchId}`)
      const data = await response.json()
      if (response.ok) {
        const newMessages = data.messages || []
        
        // CRITICAL: Only update messages if this is still the selected match
        // This prevents race conditions when switching chats quickly
        if (selectedMatch && selectedMatch.id !== matchId) {
          console.log('⚠️ Ignoring loadMessages for old match:', matchId)
          return
        }
        
        // Check if there are actually new messages
        const hasNewMessages = newMessages.length !== messages.length
        
        setMessages(newMessages)
        
        // Mark this friend as read (remove from unread set)
        setUnreadMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(matchId)
          return newSet
        })
        
        // Save timestamp of when we last read messages from this friend
        localStorage.setItem(`lastRead_${matchId}`, new Date().toISOString())
        
        // Re-sort matches to move this conversation to the top
        sortMatchesByLastMessage()
        
        // Smart auto-scroll: Only scroll if user is at bottom OR if force scroll OR if new message arrives
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-messages')
          const mobileChatContainer = document.getElementById('mobile-chat-messages')
          
          if (chatContainer && (forceScroll || shouldAutoScroll || hasNewMessages)) {
            // Check if user is already near bottom (within 100px)
            const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100
            
            if (forceScroll || isNearBottom) {
              chatContainer.scrollTop = chatContainer.scrollHeight
            }
          }
          
          if (mobileChatContainer && (forceScroll || shouldAutoScroll || hasNewMessages)) {
            const isNearBottom = mobileChatContainer.scrollHeight - mobileChatContainer.scrollTop - mobileChatContainer.clientHeight < 100
            
            if (forceScroll || isNearBottom) {
              mobileChatContainer.scrollTop = mobileChatContainer.scrollHeight
            }
          }
        }, 50)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  // Helper function to sort matches by most recent message
  const sortMatchesByLastMessage = () => {
    setMatches(prevMatches => {
      const sorted = [...prevMatches].sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt).getTime()
        const timeB = new Date(b.lastMessageTime || b.createdAt).getTime()
        return timeB - timeA // Most recent first
      })
      return sorted
    })
  }

  // Helper function to format date as "Today", "Yesterday", or actual date
  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset hours for accurate date comparison
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (messageDateOnly.getTime() === todayDateOnly.getTime()) {
      return 'Today'
    } else if (messageDateOnly.getTime() === yesterdayDateOnly.getTime()) {
      return 'Yesterday'
    } else {
      // Format as "Nov 5, 2025" or "5 Nov 2025"
      const options = { month: 'short', day: 'numeric', year: 'numeric' }
      return messageDate.toLocaleDateString('en-US', options)
    }
  }

  // Helper function to check if we should show a date separator
  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true // Always show for first message

    const currentDate = new Date(currentMessage.createdAt)
    const previousDate = new Date(previousMessage.createdAt)

    // Compare dates (ignoring time)
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate())

    return currentDateOnly.getTime() !== previousDateOnly.getTime()
  }

  const updateOnlineStatus = async () => {
    if (!currentUser || !currentUser.id) return
    try {
      await fetch('/api/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
    } catch (error) {
      console.error('Failed to update online status:', error)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('/api/online')
      const data = await response.json()
      if (response.ok) {
        setOnlineUsers(new Set(data.onlineUsers || []))
      }
    } catch (error) {
      console.error('Failed to load online users:', error)
    }
  }

  const loadFriendRequests = async (userId) => {
    try {
      const response = await fetch(`/api/friend-request/pending?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setFriendRequests(data || [])
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error)
    }
  }

  const loadBlockedUsers = async (userId) => {
    try {
      const response = await fetch(`/api/blocked-users?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        const blockedIds = data.map(b => b.blocked_id)
        setBlockedUsers(new Set(blockedIds))
        
        // Fetch full profile data for blocked users
        if (blockedIds.length > 0) {
          const profilesResponse = await fetch(`/api/profiles?userId=${userId}`)
          const profilesData = await profilesResponse.json()
          if (profilesResponse.ok) {
            const blockedProfiles = profilesData.profiles.filter(p => blockedIds.includes(p.id))
            setBlockedUsersList(blockedProfiles)
          }
        } else {
          setBlockedUsersList([])
        }
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error)
    }
  }

  const sendFriendRequest = async (receiverId) => {
    try {
      const response = await fetch('/api/friend-request/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Friend request sent!')
        // Optionally add to liked profiles to show "Request Sent"
        setLikedProfiles(prev => new Set(prev).add(receiverId))
      } else {
        toast.error(data.error || 'Failed to send request')
      }
    } catch (error) {
      toast.error('Failed to send friend request')
    }
  }

  const acceptFriendRequest = async (requestIdOrObject) => {
    try {
      // Handle both cases: passing just ID or full request object
      const requestId = typeof requestIdOrObject === 'string' ? requestIdOrObject : requestIdOrObject.id
      const request = typeof requestIdOrObject === 'object' ? requestIdOrObject : null

      console.log('✅ Accepting friend request:', { requestId, request })

      const response = await fetch('/api/friend-request/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestId,
          userId1: request ? request.receiver_id : currentUser.id,
          userId2: request ? request.sender_id : requestIdOrObject
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Friend request accepted! You can now chat 🎉')
        // Only reload matches, not friend requests (will be removed from UI by caller)
        await loadMatches(currentUser.id)
        return true
      } else {
        console.error('❌ Accept error:', data.error)
        toast.error(data.error || 'Failed to accept request')
        return false
      }
    } catch (error) {
      console.error('❌ Accept friend request error:', error)
      toast.error('Failed to accept friend request')
      return false
    }
  }

  const rejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch('/api/friend-request/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Request rejected')
        // Don't reload list, will be removed from UI by caller
        return true
      } else {
        toast.error(data.error || 'Failed to reject request')
        return false
      }
    } catch (error) {
      toast.error('Failed to reject request')
      return false
    }
  }

  const blockUser = async (blockedId) => {
    try {
      const response = await fetch('/api/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerId: currentUser.id,
          blockedId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('User blocked - You can\'t chat anymore')
        setBlockedUsers(prev => new Set(prev).add(blockedId))
        // Remove from liked profiles so they can send request again when unblocked
        setLikedProfiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(blockedId)
          return newSet
        })
        // Reload blocked users list to update the Blocked tab
        loadBlockedUsers(currentUser.id)
        // Reload matches to show blocked status
        loadMatches(currentUser.id)
        // Don't close the chat - let them see the blocked message
      } else {
        toast.error(data.error || 'Failed to block user')
      }
    } catch (error) {
      toast.error('Failed to block user')
    }
  }

  const removeFriend = async (friendId) => {
    try {
      const response = await fetch('/api/remove-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: currentUser.id,
          userId2: friendId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Friend removed')
        // Remove from liked profiles so they can send request again
        setLikedProfiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(friendId)
          return newSet
        })
        loadMatches(currentUser.id)
        setSelectedMatch(null)
      } else {
        toast.error(data.error || 'Failed to remove friend')
      }
    } catch (error) {
      toast.error('Failed to remove friend')
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
    
    setTypingTimeout(timeout)
  }

  const handleLike = async (profileId) => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: profileId
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.matched) {
          toast.success('🎉 It\'s a match!')
          loadMatches(currentUser.id)
        } else {
          toast.success('Friend request sent!')
        }
        // Add to liked profiles set instead of removing
        setLikedProfiles(new Set([...likedProfiles, profileId]))
      } else {
        toast.error(data.error || 'Failed to send request')
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }
  }

  const openProfileView = (profile) => {
    setSelectedProfile(profile)
    setShowProfileModal(true)
  }

  const closeProfileView = () => {
    setSelectedProfile(null)
    setShowProfileModal(false)
  }

  const handleSwipeLeft = () => {
    setSwipeDirection('left')
    setTimeout(() => {
      setCurrentProfileIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handleSwipeRight = async () => {
    const currentProfile = profiles[currentProfileIndex]
    if (currentProfile && !likedProfiles.has(currentProfile.id)) {
      await handleLike(currentProfile.id)
    }
    setSwipeDirection('right')
    setTimeout(() => {
      setCurrentProfileIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleSwipeLeft()
    } else if (isRightSwipe) {
      handleSwipeRight()
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const tempMessage = messageInput
    setMessageInput('')
    setIsTyping(false)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          senderId: currentUser.id,
          message: tempMessage
        })
      })

      if (response.ok) {
        // Update the lastMessageTime for this match to move it to the top
        setMatches(prevMatches => {
          return prevMatches.map(match => {
            if (match.id === selectedMatch.id) {
              return { ...match, lastMessageTime: new Date().toISOString() }
            }
            return match
          })
        })
        
        // Force scroll to bottom when user sends a message
        setShouldAutoScroll(true)
        loadMessages(selectedMatch.id, true)
      } else {
        toast.error('Failed to send message')
        setMessageInput(tempMessage)
      }
    } catch (error) {
      toast.error('Something went wrong!')
      setMessageInput(tempMessage)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setView('landing')
    toast.success('Logged out successfully')
  }

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault()
    console.log('=== PROFILE UPDATE STARTED ===')
    console.log('Form submitted, current state:', { loading, uploadingPhoto })
    
    if (loading || uploadingPhoto) {
      console.log('Already processing, skipping...')
      toast.warning('Please wait, already processing...')
      return
    }
    
    setLoading(true)

    try {
      console.log('Profile form data:', profileForm)
      console.log('Current user:', currentUser)
      
      // Upload photo if it's a base64 preview
      let finalPhotoUrl = profileForm.photo_url
      if (profileForm.photo_url && !profileForm.photo_url.startsWith('http')) {
        console.log('📸 Photo is base64, uploading to server...')
        toast.loading('Uploading photo...', { id: 'photo-upload' })
        
        finalPhotoUrl = await uploadPhotoToServer(profileForm.photo_url)
        console.log('Photo upload result:', finalPhotoUrl)
        
        if (!finalPhotoUrl) {
          setLoading(false)
          toast.error('Failed to upload photo. Please try again.', { id: 'photo-upload' })
          console.error('❌ Photo upload failed, stopping profile update')
          return
        }
        
        toast.success('Photo uploaded successfully!', { id: 'photo-upload' })
        console.log('✅ Photo uploaded:', finalPhotoUrl)
      } else {
        console.log('Photo is already a URL or empty:', finalPhotoUrl)
      }

      const interestsArray = profileForm.interests.split(',').map(i => i.trim()).filter(i => i)
      
      const payload = {
        userId: currentUser.id,
        name: profileForm.name,
        bio: profileForm.bio,
        department: profileForm.department,
        year: profileForm.year,
        photo_url: finalPhotoUrl,
        interests: interestsArray
      }
      
      console.log('💾 Sending profile update to API:', payload)
      toast.loading('Saving profile...', { id: 'profile-save' })
      
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('API response status:', response.status)
      const data = await response.json()
      console.log('API response data:', data)

      if (response.ok) {
        toast.success('Profile updated successfully!', { id: 'profile-save' })
        const updatedUser = { ...currentUser, ...data.profile }
        console.log('✅ Updated user object:', updatedUser)
        setCurrentUser(updatedUser)
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        
        // Update the profile form with new data
        setProfileForm({
          name: updatedUser.name || '',
          bio: updatedUser.bio || '',
          department: updatedUser.department || '',
          year: updatedUser.year || '',
          interests: updatedUser.interests ? updatedUser.interests.join(', ') : '',
          photo_url: updatedUser.photo_url || ''
        })
        
        setIsEditingProfile(false)
        
        // Reload profiles to show updated data
        console.log('🔄 Reloading profiles...')
        await loadProfiles(currentUser.id)
        console.log('=== ✅ PROFILE UPDATE COMPLETED SUCCESSFULLY ===')
      } else {
        console.error('❌ Profile update failed:', data)
        toast.error(data.error || 'Failed to update profile', { id: 'profile-save' })
      }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      toast.error('Something went wrong: ' + error.message, { id: 'profile-save' })
    } finally {
      setLoading(false)
      console.log('=== PROFILE UPDATE FINISHED (loading set to false) ===')
    }
  }

  const openMyProfile = () => {
    setProfileForm({
      name: currentUser.name || '',
      bio: currentUser.bio || '',
      department: currentUser.department || '',
      year: currentUser.year || '',
      interests: currentUser.interests ? currentUser.interests.join(', ') : '',
      photo_url: currentUser.photo_url || ''
    })
    setView('profile')
    setIsEditingProfile(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      console.log('🔍 Searching for:', searchQuery)
      console.log('👤 Current user ID:', currentUser.id)
      
      // Search in profiles by name, email, or department
      const response = await fetch(`/api/profiles?userId=${currentUser.id}`)
      const data = await response.json()
      
      console.log('📊 Total profiles received from database:', data.profiles?.length)
      console.log('📋 Sample profiles:', data.profiles?.slice(0, 3))
      
      if (response.ok && data.profiles) {
        const query = searchQuery.toLowerCase().trim()
        console.log('🔎 Search query (lowercase):', query)
        
        const filtered = data.profiles.filter(profile => {
          // Skip blocked users
          if (blockedUsers.has(profile.id)) return false
          
          // Search in multiple fields
          const nameMatch = profile.name?.toLowerCase().includes(query)
          const emailMatch = profile.email?.toLowerCase().includes(query)
          const deptMatch = profile.department?.toLowerCase().includes(query)
          const bioMatch = profile.bio?.toLowerCase().includes(query)
          
          const matches = nameMatch || emailMatch || deptMatch || bioMatch
          
          if (matches) {
            console.log('✅ Match found:', {
              email: profile.email,
              name: profile.name,
              department: profile.department,
              matched_by: nameMatch ? 'name' : emailMatch ? 'email' : deptMatch ? 'department' : 'bio'
            })
          }
          
          return matches
        })
        
        console.log('✅ Search complete. Results:', filtered.length, 'profiles found')
        setSearchResults(filtered)
        
        if (filtered.length === 0) {
          toast.info('No users found matching "' + searchQuery + '"')
        } else {
          toast.success(`Found ${filtered.length} user${filtered.length !== 1 ? 's' : ''}`)
        }
      } else {
        console.error('❌ Failed to fetch profiles:', data)
        toast.error('Failed to load profiles from database')
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      toast.error('Failed to search users: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        handleSearch()
      }, 500) // Wait 500ms after user stops typing
      
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handlePhotoSelect = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileForm({ ...profileForm, photo_url: reader.result })
      toast.success('Photo selected! Click "Save Changes" to upload.')
    }
    reader.readAsDataURL(file)
  }

  const uploadPhotoToServer = async (photoUrl) => {
    if (!photoUrl || photoUrl.startsWith('http')) {
      // Already a URL, no need to upload
      return photoUrl
    }

    setUploadingPhoto(true)
    console.log('🔄 Starting photo upload...')

    try {
      // Convert base64 to blob
      console.log('📦 Converting base64 to blob...')
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      console.log('✅ Blob created:', blob.size, 'bytes', blob.type)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileExtension = blob.type.split('/')[1] || 'jpg'
      const fileName = `profile_${currentUser.id}_${timestamp}_${randomStr}.${fileExtension}`
      console.log('📝 Generated filename:', fileName)
      
      // Upload to Supabase Storage
      console.log('☁️ Uploading to Supabase Storage...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          contentType: blob.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError)
        throw new Error(uploadError.message)
      }

      console.log('✅ File uploaded to Supabase:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('🔗 Public URL generated:', publicUrl)

      setUploadingPhoto(false)
      toast.success('Photo uploaded successfully!')
      return publicUrl
      
    } catch (error) {
      console.error('❌ Photo upload error:', error)
      setUploadingPhoto(false)
      
      // Provide more specific error messages
      if (error.message.includes('storage')) {
        toast.error('Storage error: Please ensure the profile-photos bucket exists in Supabase')
      } else if (error.message.includes('network')) {
        toast.error('Network error: Please check your internet connection')
      } else {
        toast.error('Failed to upload photo: ' + error.message)
      }
      
      return null
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    handlePhotoSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handlePhotoSelect(file)
    }
  }

  // Landing Page
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <Heart className="h-16 w-16 text-pink-500 fill-pink-500 animate-pulse" />
              </div>
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Anurag Connect
              </h1>
              <p className="text-2xl text-gray-600 mb-2">Find Your Campus Match</p>
              <p className="text-lg text-gray-500">Exclusive dating platform for Anurag University students</p>
            </div>

            {/* College Photos */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://imgs.search.brave.com/9cn1qJqcslIJ7dghXNNeGr7W4Z88xiORw-Qs48dFANw/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9hbnVy/YWcuYWMuaW4vd3At/Y29udGVudC91cGxv/YWRzLzIwMjMvMDMv/QWJvdXQtQW51cmFn/LWNvbGxlZ2UtMS5q/cGc"
                  alt="Anurag University Campus" 
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://imgs.search.brave.com/oeRq5Kq72YWx9vLReCGy8JXTcJhgKzrTMgYsW7vDfzw/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8w/LzAzL0FudXJhZ19V/bml2ZXJzaXR5XyUy/MkVfQkxPQ0tfJl9G/X0JMT0NLJTIyX2lt/YWdlLmpwZw"
                  alt="Anurag University Block" 
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="border-2 border-pink-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Users className="h-12 w-12 text-pink-500" />
                  </div>
                  <CardTitle className="text-center">Connect with Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600">Meet fellow Anurag University students and make meaningful connections</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Sparkles className="h-12 w-12 text-purple-500" />
                  </div>
                  <CardTitle className="text-center">Smart Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600">Find matches based on interests, department, and year</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <MessageCircle className="h-12 w-12 text-blue-500" />
                  </div>
                  <CardTitle className="text-center">Chat & Connect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600">Start conversations with your matches instantly</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={() => setView('auth')} 
                size="lg" 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-12 py-6 text-xl rounded-full shadow-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Auth Page
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col items-center justify-center p-4 py-8">
        {/* Login/Signup Card */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-12 w-12 text-pink-500 fill-pink-500" />
            </div>
            <CardTitle className="text-center text-3xl">Anurag Connect</CardTitle>
            <CardDescription className="text-center">
              {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">College ID</label>
                <Input
                  type="email"
                  placeholder="your_rollnumber@anurag.edu.in"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value.toLowerCase() })}
                  required
                />
                {authMode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: YYegDDDSRR@anurag.edu.in (YY=batch, DDD=105/505, S=section, RR=roll no.)
                  </p>
                )}
                {authMode === 'login' && (
                  <p className="text-xs text-gray-500 mt-1">Use your college ID to login</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-sm text-purple-600 hover:underline"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setView('landing')}
                className="text-sm text-gray-500 hover:underline"
              >
                ← Back to home
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Community Guidelines */}
        <div className="w-full max-w-2xl mt-6">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-full p-2">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Safety & Community Guidelines
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Report Abuse */}
              <div className="bg-white rounded-xl p-3 border-l-4 border-red-500">
                <h4 className="font-bold text-red-700 text-sm mb-1.5 flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Report Inappropriate Behavior
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  If anyone is messaging you in a <strong>bad, violent, or inappropriate manner</strong>, 
                  please <strong>DM me immediately on Instagram</strong> (@anurag_slines). 
                  I will take action within <strong>24 hours</strong> and ensure that account is suspended or banned.
                </p>
              </div>

              {/* Warning System */}
              <div className="bg-white rounded-xl p-3 border-l-4 border-orange-500">
                <h4 className="font-bold text-orange-700 text-sm mb-1.5 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warning System
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-0.5">1.</span>
                    <span>First-time violators will receive a <strong>warning notification</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-0.5">2.</span>
                    <span>After <strong>5 warnings</strong>, the account will be <strong>permanently banned</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-0.5">3.</span>
                    <span>Severe violations may result in <strong>immediate ban</strong> without warnings</span>
                  </li>
                </ul>
              </div>

              {/* Be Respectful */}
              <div className="bg-white rounded-xl p-3 border-l-4 border-green-500">
                <h4 className="font-bold text-green-700 text-sm mb-1.5 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Be Respectful & Kind
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  This platform is for making genuine connections. Please treat everyone with respect and kindness. 
                  Let's build a positive community together! 💖
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Profile Setup Page
  if (view === 'profile-setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">Tell us about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSetup} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  placeholder="Tell others about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Input
                    type="text"
                    placeholder="e.g., CSE, ECE, ME"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <Input
                    type="text"
                    placeholder="e.g., 1st, 2nd, 3rd, 4th"
                    value={profileForm.year}
                    onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Interests (comma separated)</label>
                <Input
                  type="text"
                  placeholder="e.g., Music, Sports, Coding, Reading"
                  value={profileForm.interests}
                  onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Profile Photo</label>
                
                {/* Drag and Drop Zone with Preview */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                    isDragging 
                      ? 'border-pink-500 bg-pink-50 scale-105 shadow-lg' 
                      : 'border-gray-300 hover:border-pink-400 hover:shadow-md'
                  }`}
                >
                  {profileForm.photo_url ? (
                    // Show Preview
                    <div className="relative group">
                      <img 
                        src={profileForm.photo_url} 
                        alt="Preview" 
                        className="w-full h-64 object-cover"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                        <User className="h-12 w-12 text-white" />
                        <p className="text-white font-medium">Drop new photo to replace</p>
                        <label className="cursor-pointer">
                          <div className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                            Choose Different Photo
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, photo_url: '' })}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show Upload Zone
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-pink-100' : 'bg-gray-100'}`}>
                          <User className={`h-16 w-16 ${isDragging ? 'text-pink-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-700 mb-1">
                            {isDragging ? 'Drop your photo here!' : 'Drag and drop your photo'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports: JPG, PNG, GIF (Max 5MB)
                          </p>
                        </div>
                        <div className="flex items-center gap-3 w-full max-w-xs">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <span className="text-xs text-gray-500 uppercase">or</span>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                        <label className="cursor-pointer">
                          <div className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium">
                            Browse Files
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Or use URL */}
                {!profileForm.photo_url && (
                  <div className="mt-4 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or paste image URL</span>
                      </div>
                    </div>
                    <Input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={profileForm.photo_url}
                      onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })}
                    />
                  </div>
                )}

                {profileForm.photo_url && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                    Photo ready! Click "Complete Profile" to save
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                disabled={loading}
              >
                {loading ? 'Creating profile...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // My Profile Page
  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Anurag Connect
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={() => setView('main')} variant="outline" size="sm">
                  ← Back to App
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl">My Profile</CardTitle>
                    <CardDescription>View and edit your profile information</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditingProfile ? (
                  // View Mode
                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={currentUser?.photo_url} />
                          <AvatarFallback className="text-4xl">
                            {currentUser?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-lg font-semibold">{currentUser?.name || 'Not provided'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-lg">{currentUser?.email || 'Not provided'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Department</label>
                          <p className="text-lg">{currentUser?.department || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Year</label>
                          <p className="text-lg">{currentUser?.year || 'Not provided'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Bio</label>
                        <p className="text-lg">{currentUser?.bio || 'Not provided'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Interests</label>
                        {currentUser?.interests && currentUser.interests.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {currentUser.interests.map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="text-base px-3 py-1">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-lg">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Bio</label>
                      <Textarea
                        placeholder="Tell others about yourself..."
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Department</label>
                        <Input
                          type="text"
                          placeholder="e.g., CSE, ECE, ME"
                          value={profileForm.department}
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Year</label>
                        <Input
                          type="text"
                          placeholder="e.g., 1st, 2nd, 3rd, 4th"
                          value={profileForm.year}
                          onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Interests (comma separated)</label>
                      <Input
                        type="text"
                        placeholder="e.g., Music, Sports, Coding, Reading"
                        value={profileForm.interests}
                        onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Profile Photo</label>
                      
                      {/* Drag and Drop Zone with Preview */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                          isDragging 
                            ? 'border-pink-500 bg-pink-50 scale-105 shadow-lg' 
                            : 'border-gray-300 hover:border-pink-400 hover:shadow-md'
                        }`}
                      >
                        {profileForm.photo_url ? (
                          // Show Preview
                          <div className="relative group">
                            <img 
                              src={profileForm.photo_url} 
                              alt="Preview" 
                              className="w-full h-64 object-cover"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                              <User className="h-12 w-12 text-white" />
                              <p className="text-white font-medium">Drop new photo to replace</p>
                              <label className="cursor-pointer">
                                <div className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                                  Choose Different Photo
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setProfileForm({ ...profileForm, photo_url: '' })}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Remove Photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Show Upload Zone
                          <div className="p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className={`p-4 rounded-full ${isDragging ? 'bg-pink-100' : 'bg-gray-100'}`}>
                                <User className={`h-16 w-16 ${isDragging ? 'text-pink-500' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-700 mb-1">
                                  {isDragging ? 'Drop your photo here!' : 'Drag and drop your photo'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Supports: JPG, PNG, GIF (Max 5MB)
                                </p>
                              </div>
                              <div className="flex items-center gap-3 w-full max-w-xs">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="text-xs text-gray-500 uppercase">or</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                              </div>
                              <label className="cursor-pointer">
                                <div className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium">
                                  Browse Files
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Or use URL */}
                      {!profileForm.photo_url && (
                        <div className="mt-4 space-y-2">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">Or paste image URL</span>
                            </div>
                          </div>
                          <Input
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            value={profileForm.photo_url}
                            onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })}
                          />
                        </div>
                      )}

                      {profileForm.photo_url && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                            Photo ready! Click "Save Changes" below to upload and save your profile.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg"
                        disabled={loading || uploadingPhoto}
                        onClick={() => console.log('Save button clicked, loading:', loading, 'uploadingPhoto:', uploadingPhoto)}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Saving...
                          </span>
                        ) : uploadingPhoto ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">📤</span> Uploading Photo...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false)
                          // Reset any stuck states
                          setLoading(false)
                          setUploadingPhoto(false)
                        }}
                        disabled={loading || uploadingPhoto}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main App
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-pink-500 fill-pink-500" />
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Anurag Connect
              </h1>
            </div>
            <div className="flex items-center gap-1 md:gap-3">
              {/* Help Button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Help & Support"
              >
                <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              </button>
              
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                  {(unreadWarningsCount > 0 || friendRequests.length > 0) && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 bg-red-500 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse z-10">
                      {unreadWarningsCount + friendRequests.length}
                    </span>
                  )}
                </button>
              </div>
              
              <button 
                onClick={openMyProfile}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 md:px-3 py-2 transition-colors"
              >
                <Avatar className="cursor-pointer h-7 w-7 md:h-9 md:w-9">
                  <AvatarImage src={currentUser?.photo_url} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-xs md:text-sm font-medium hidden sm:inline">{currentUser?.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-t-3xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-3">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold">Need Help?</h2>
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-white/90">We're here to support you!</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-3">
                <p className="text-gray-700 font-medium">
                  📱 For any queries, DM me on Instagram
                </p>
                
                <a
                  href="https://www.instagram.com/anurag_slines?utm_source=qr&igsh=ZThxb3B2MnNqaTJ1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @anurag_slines
                </a>
                
                <p className="text-sm text-purple-600 font-semibold">
                  👉 Follow for updates and announcements!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-shrink-0 p-4 md:p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Notifications</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {(friendRequests.length > 0 || unreadWarningsCount > 0) && (
                <div className="mt-3 flex items-center gap-2">
                  {friendRequests.length > 0 && (
                    <Badge className="bg-pink-500 text-xs">
                      {friendRequests.length} friend request{friendRequests.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {unreadWarningsCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadWarningsCount} warning{unreadWarningsCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="requests" className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 rounded-none bg-gray-50">
                <TabsTrigger value="requests" className="relative">
                  Friend Requests
                  {friendRequests.length > 0 && (
                    <span className="ml-2 h-5 w-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="warnings" className="relative">
                  Warnings
                  {unreadWarningsCount > 0 && (
                    <span className="ml-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadWarningsCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Friend Requests Tab */}
              <TabsContent value="requests" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" style={{maxHeight: 'calc(90vh - 180px)'}}>
                {friendRequests.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No friend requests</p>
                    <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden hover:shadow-2xl transition-all border-2 border-purple-200">
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                            <AvatarImage src={request.photo_url} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                              {request.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-purple-900">{request.name}</h4>
                            <p className="text-sm text-gray-700">{request.department} • Year {request.year}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              📅 Sent {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 space-y-3">
                        {/* Bio */}
                        {request.bio && (
                          <div>
                            <p className="text-sm text-gray-700 line-clamp-2">{request.bio}</p>
                          </div>
                        )}
                        
                        {/* Interests */}
                        {request.interests && request.interests.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Interests:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.interests.slice(0, 3).map((interest, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {request.interests.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{request.interests.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button
                            onClick={() => {
                              openProfileView(request)
                              setShowNotifications(false)
                            }}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={async () => {
                              await acceptFriendRequest(request)
                              // Remove from list immediately
                              setFriendRequests(prev => prev.filter(r => r.id !== request.id))
                            }}
                            size="sm"
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={async () => {
                              await rejectFriendRequest(request.id)
                              // Remove from list immediately
                              setFriendRequests(prev => prev.filter(r => r.id !== request.id))
                            }}
                            size="sm"
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Warnings Tab */}
              <TabsContent value="warnings" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3" style={{maxHeight: 'calc(90vh - 180px)'}}>
                {warnings.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No warnings</p>
                    <p className="text-xs text-gray-400 mt-1">Keep being awesome!</p>
                  </div>
                ) : (
                  warnings.map((warning) => (
                    <div key={warning.id} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                              Warning from Admin
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed mb-2">
                            {warning.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {new Date(warning.createdAt).toLocaleDateString()} at {new Date(warning.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <button
                              onClick={() => markWarningAsRead(warning.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {warnings.length > 0 && (
                  <div className="pt-3 border-t text-center">
                    <button
                      onClick={() => {
                        warnings.forEach(w => markWarningAsRead(w.id))
                      }}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Clear all warnings
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 overflow-x-hidden">
        {/* Welcome Screen Overlay */}
        {showWelcomeScreen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-8 rounded-t-3xl text-white text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-4">
                    <Heart className="h-12 w-12" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-2">Welcome to Anurag Connect!</h2>
                <p className="text-white/90 text-lg">Let's get started! 🚀</p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Welcome Info */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-500 rounded-full p-3 flex-shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-900 mb-2 text-lg">Start Making Connections!</h3>
                      <p className="text-sm text-gray-700">
                        Find friends, make connections, and build meaningful relationships. 
                        Be respectful and enjoy your experience! 💖
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instagram Contact - Mandatory */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border-2 border-pink-300 shadow-md">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-pink-600" />
                      <h3 className="font-bold text-pink-900 text-base">Need Help? Contact Me!</h3>
                    </div>
                    <p className="text-xs text-gray-700">
                      📱 For any queries or support, DM me on Instagram
                    </p>
                    
                    <a
                      href="https://www.instagram.com/anurag_slines?utm_source=qr&igsh=ZThxb3B2MnNqaTJ1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      @anurag_slines
                    </a>
                    
                    <p className="text-xs text-purple-700 font-semibold">
                      👉 Follow for updates & announcements!
                    </p>
                  </div>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={() => {
                    setShowWelcomeScreen(false)
                    localStorage.setItem('hasSeenWelcome', 'true')
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Continue to App 🚀
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="discover" className="w-full overflow-x-hidden">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="matches" className="relative">
              Friends
              {unreadMessages.size > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 bg-red-500 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse z-10">
                  {unreadMessages.size}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="blocked" className="relative">
              Blocked
              {blockedUsers.size > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 bg-gray-500 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center z-10">
                  {blockedUsers.size}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="overflow-x-hidden">
            <div className="max-w-2xl mx-auto px-4">
              {/* Modern Animated Header */}
              <div className="text-center mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-3xl -z-10 animate-pulse"></div>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 mb-2">
                  Discover Students
                </h2>
                <p className="text-gray-600 text-sm font-medium">Find your perfect match at Anurag University</p>
              </div>
              
              {currentProfileIndex >= profiles.length ? (
                <div className="relative">
                  {/* Glassmorphism card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 via-purple-200/50 to-blue-200/50 blur-2xl"></div>
                  <Card className="relative backdrop-blur-xl bg-white/60 border-2 border-white/50 shadow-2xl p-12 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-300/30 to-purple-300/30 rounded-full blur-3xl -ml-32 -mb-32"></div>
                    <div className="text-center text-gray-600 relative z-10">
                      <div className="relative inline-block mb-6">
                        <Heart className="h-20 w-20 mx-auto text-pink-400 animate-bounce" />
                        <div className="absolute inset-0 bg-pink-400/30 blur-2xl animate-pulse"></div>
                      </div>
                      <p className="text-2xl font-bold mb-2 text-gray-800">No more profiles to show</p>
                      <p className="text-base mt-2 mb-6 text-gray-600">Check back later for new students!</p>
                      <Button 
                        onClick={() => setCurrentProfileIndex(0)}
                        className="mt-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:from-pink-700 hover:via-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start Over
                      </Button>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="relative pb-4">
                  {/* Swipe Card Container with 3D effect */}
                  <div className="swipe-container relative min-h-[600px] flex items-center justify-center mb-8" style={{ perspective: '1000px' }}>
                    {/* Background glow effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-blue-300/20 blur-3xl animate-pulse"></div>
                    
                    {profiles[currentProfileIndex] && (
                      <Card 
                        className={`relative w-full max-w-md mx-auto overflow-hidden shadow-2xl transition-all duration-500 rounded-3xl border-2 border-white/60 hover:shadow-pink-500/30 ${
                          swipeDirection === 'left' ? 'translate-x-[-150%] rotate-[-20deg] opacity-0' :
                          swipeDirection === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' :
                          'translate-x-0 rotate-0 opacity-100 hover:scale-[1.02]'
                        }`}
                        style={{
                          transformStyle: 'preserve-3d',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px -15px rgba(236, 72, 153, 0.3)'
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {/* Photo Section with enhanced gradient */}
                        <div 
                          className="relative h-[450px] bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 overflow-hidden cursor-pointer"
                          onClick={() => openProfileView(profiles[currentProfileIndex])}
                        >
                          {profiles[currentProfileIndex].photo_url ? (
                            <img 
                              src={profiles[currentProfileIndex].photo_url} 
                              alt={profiles[currentProfileIndex].name} 
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 opacity-50"></div>
                              <User className="h-40 w-40 text-white/80 relative z-10" />
                            </div>
                          )}
                          
                          {/* Enhanced gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                          
                          {/* Decorative elements */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
                          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/30 to-transparent rounded-full blur-3xl"></div>
                          
                          {/* Info overlay with glassmorphism */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white backdrop-blur-sm bg-gradient-to-t from-black/60 to-transparent">
                            <h2 className="text-4xl font-black mb-2 drop-shadow-2xl tracking-tight">
                              {profiles[currentProfileIndex].name}
                              {profiles[currentProfileIndex].year && (
                                <span className="text-2xl ml-2 opacity-95 font-bold">, {profiles[currentProfileIndex].year}</span>
                              )}
                            </h2>
                            {profiles[currentProfileIndex].department && (
                              <div className="inline-block backdrop-blur-md bg-white/20 px-4 py-2 rounded-full border border-white/30">
                                <p className="text-base font-semibold drop-shadow-lg flex items-center gap-2">
                                  <span className="text-xl">📚</span>
                                  {profiles[currentProfileIndex].department}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Enhanced already liked badge or Send Request button */}
                          {likedProfiles.has(profiles[currentProfileIndex].id) ? (
                            <div className="absolute top-6 right-6 backdrop-blur-xl bg-green-500/90 text-white px-5 py-3 rounded-2xl text-sm font-black shadow-2xl animate-pulse border-2 border-white/50">
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 fill-white" />
                                <span>Request Sent</span>
                              </div>
                            </div>
                          ) : (
                            <Button
                              className="absolute top-6 right-6 backdrop-blur-xl bg-pink-500/90 hover:bg-pink-600 text-white px-5 py-3 rounded-2xl text-sm font-black shadow-2xl border-2 border-white/50"
                              onClick={(e) => {
                                e.stopPropagation()
                                sendFriendRequest(profiles[currentProfileIndex].id)
                              }}
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              Send Request
                            </Button>
                          )}
                        </div>

                        {/* Quick Info Section with gradient background */}
                        <CardContent 
                          className="p-6 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 backdrop-blur-sm cursor-pointer"
                          onClick={() => openProfileView(profiles[currentProfileIndex])}
                        >
                          {/* Bio Preview */}
                          {profiles[currentProfileIndex].bio && (
                            <div className="mb-4 p-4 backdrop-blur-sm bg-white/60 rounded-2xl border border-white/50 shadow-md">
                              <p className="text-gray-800 text-sm line-clamp-3 leading-relaxed font-medium">
                                💭 {profiles[currentProfileIndex].bio}
                              </p>
                            </div>
                          )}

                          {/* Interests Preview with modern pills */}
                          {profiles[currentProfileIndex].interests && profiles[currentProfileIndex].interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {profiles[currentProfileIndex].interests.slice(0, 4).map((interest, idx) => (
                                <Badge 
                                  key={idx} 
                                  className="text-xs px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-white/50"
                                >
                                  {interest}
                                </Badge>
                              ))}
                              {profiles[currentProfileIndex].interests.length > 4 && (
                                <Badge className="text-xs px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow-lg border-2 border-white/50">
                                  +{profiles[currentProfileIndex].interests.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Action Buttons with modern design */}
                  <div className="flex justify-center items-center gap-6 mb-4">
                    {/* Pass Button */}
                    <button
                      onClick={handleSwipeLeft}
                      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-2xl hover:shadow-red-500/50 transition-all border-4 border-white hover:scale-110 active:scale-95 flex items-center justify-center group overflow-hidden"
                      aria-label="Pass"
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all"></div>
                      <X className="h-10 w-10 text-white relative z-10" strokeWidth={3} />
                      <div className="absolute inset-0 bg-red-400/50 blur-xl group-hover:blur-2xl transition-all"></div>
                    </button>

                    {/* Like Button */}
                    <button
                      onClick={handleSwipeRight}
                      disabled={likedProfiles.has(profiles[currentProfileIndex]?.id)}
                      className={`relative w-20 h-20 rounded-full shadow-2xl transition-all border-4 border-white active:scale-95 flex items-center justify-center group overflow-hidden ${
                        likedProfiles.has(profiles[currentProfileIndex]?.id)
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-br from-green-400 to-green-600 hover:shadow-green-500/50 hover:scale-110'
                      }`}
                      aria-label="Like"
                    >
                      <div className={`absolute inset-0 ${likedProfiles.has(profiles[currentProfileIndex]?.id) ? '' : 'bg-white/20 group-hover:bg-white/30'} transition-all`}></div>
                      <Heart className={`h-10 w-10 relative z-10 ${
                        likedProfiles.has(profiles[currentProfileIndex]?.id)
                          ? 'text-white fill-white'
                          : 'text-white fill-white'
                      }`} strokeWidth={3} />
                      {!likedProfiles.has(profiles[currentProfileIndex]?.id) && (
                        <div className="absolute inset-0 bg-green-400/50 blur-xl group-hover:blur-2xl transition-all"></div>
                      )}
                    </button>
                  </div>

                  {/* Keyboard shortcuts hint with modern style */}
                  <div className="text-center mt-6">
                    <div className="inline-block backdrop-blur-md bg-white/70 px-6 py-3 rounded-full border border-white/50 shadow-lg">
                      <p className="text-xs text-gray-700 font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Use ← → arrow keys or swipe on mobile
                        <Sparkles className="h-4 w-4 text-pink-500" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Full Profile Modal */}
            {showProfileModal && selectedProfile && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={closeProfileView}
              >
                <div 
                  className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with photo */}
                  <div className="relative h-80 bg-gradient-to-br from-pink-200 to-purple-200">
                    {selectedProfile.photo_url ? (
                      <img 
                        src={selectedProfile.photo_url} 
                        alt={selectedProfile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User className="h-32 w-32 text-gray-400" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    {/* Name overlay */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
                        {selectedProfile.name}
                      </h1>
                      {selectedProfile.department && selectedProfile.year && (
                        <p className="text-lg opacity-95 drop-shadow-md">
                          📚 {selectedProfile.department} • {selectedProfile.year} Year
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Bio */}
                    {selectedProfile.bio && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-2xl">💭</span>
                          About
                        </h3>
                        <p className="text-gray-700 leading-relaxed">{selectedProfile.bio}</p>
                      </div>
                    )}

                    {/* Interests */}
                    {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.interests.map((interest, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-sm px-4 py-2"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {selectedProfile.email && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-2xl">📧</span>
                          Contact
                        </h3>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-5 w-5" />
                          <span>{selectedProfile.email}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
                  Search Students
                </h2>
                <p className="text-gray-600">Find students by name, email, or department</p>
              </div>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, or department..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch()
                        }
                      }}
                      className="pl-12 h-14 text-lg border-2 focus:border-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="h-14 px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              <div>
                {/* Loading State */}
                {isSearching && (
                  <Card className="p-12">
                    <div className="text-center text-gray-500">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-xl">Searching...</p>
                      <p className="text-sm mt-2">Looking for "{searchQuery}"</p>
                    </div>
                  </Card>
                )}

                {/* No Results */}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <Card className="p-12">
                    <div className="text-center text-gray-500">
                      <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl font-semibold">No users found</p>
                      <p className="text-sm mt-2">No one matches "{searchQuery}"</p>
                      <p className="text-xs text-gray-400 mt-2">Try searching with different keywords like name, email, or department</p>
                    </div>
                  </Card>
                )}

                {/* Empty State - Before Search */}
                {!isSearching && !searchQuery && (
                  <Card className="p-12">
                    <div className="text-center text-gray-500">
                      <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl font-semibold">Start searching</p>
                      <p className="text-sm mt-2">Enter a name, email, or department to find students</p>
                      <div className="mt-4 text-xs text-gray-400">
                        <p>💡 Try searching for:</p>
                        <p>• Student name (e.g., "John", "Sarah")</p>
                        <p>• Email ID (e.g., "23eg105")</p>
                        <p>• Department (e.g., "CSE", "ECE")</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Search Results */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                    {searchResults.map((profile) => (
                      <Card 
                        key={profile.id} 
                        className="hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
                        onClick={() => {
                          setSelectedProfile(profile)
                          setShowProfileModal(true)
                        }}
                      >
                        <CardContent className="p-4 md:p-6">
                          {/* Desktop Layout - Side by side */}
                          <div className="hidden md:flex items-start gap-6">
                            {/* Profile Photo */}
                            <div className="relative">
                              <Avatar className="h-24 w-24 border-4 border-purple-200 group-hover:border-purple-400 transition-all">
                                <AvatarImage src={profile.photo_url} />
                                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                  {profile.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                <Eye className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold mb-2 text-purple-900">{profile.name}</h3>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {profile.email}
                                </p>
                                <p className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {profile.department} • {profile.year} Year
                                </p>
                                {profile.bio && (
                                  <p className="text-gray-700 mt-3 line-clamp-2">{profile.bio}</p>
                                )}
                                {profile.interests && profile.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {profile.interests.slice(0, 3).map((interest, index) => (
                                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                                        {interest}
                                      </Badge>
                                    ))}
                                    {profile.interests.length > 3 && (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                        +{profile.interests.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons - Desktop */}
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProfile(profile)
                                  setShowProfileModal(true)
                                }}
                                variant="outline"
                                className="border-2 border-purple-300 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              {!likedProfiles.has(profile.id) && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLike(profile.id)
                                  }}
                                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Like
                                </Button>
                              )}
                              {likedProfiles.has(profile.id) && (
                                <Button disabled variant="secondary">
                                  <Heart className="h-4 w-4 mr-2 fill-current" />
                                  Liked
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Mobile Layout - Stacked */}
                          <div className="md:hidden space-y-4">
                            {/* Profile Photo and Name */}
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <Avatar className="h-16 w-16 border-4 border-purple-200">
                                  <AvatarImage src={profile.photo_url} />
                                  <AvatarFallback className="text-xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                    {profile.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-purple-900">{profile.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {profile.department} • {profile.year} Year
                                </p>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{profile.email}</span>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{profile.bio}</p>
                            )}

                            {/* Interests */}
                            {profile.interests && profile.interests.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {profile.interests.slice(0, 4).map((interest, index) => (
                                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                    {interest}
                                  </Badge>
                                ))}
                                {profile.interests.length > 4 && (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                    +{profile.interests.length - 4}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Action Buttons - Mobile (Full Width Below Profile) */}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProfile(profile)
                                  setShowProfileModal(true)
                                }}
                                variant="outline"
                                className="flex-1 border-2 border-purple-300 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              {!likedProfiles.has(profile.id) ? (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLike(profile.id)
                                  }}
                                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Like
                                </Button>
                              ) : (
                                <Button disabled variant="secondary" className="flex-1">
                                  <Heart className="h-4 w-4 mr-2 fill-current" />
                                  Liked
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="matches">
            <div className="max-w-6xl mx-auto">
              {/* Mobile Full-Page Chat View */}
              {isMobileChatOpen && selectedMatch ? (
                <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsMobileChatOpen(false)
                          setSelectedMatch(null)
                        }}
                        className="text-white hover:bg-white/20 p-2"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={selectedMatch.matchedUser?.photo_url} />
                          <AvatarFallback>{selectedMatch.matchedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        {onlineUsers.has(selectedMatch.matchedUser?.id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{selectedMatch.matchedUser?.name}</h3>
                        <p className="text-xs text-white/90">
                          {onlineUsers.has(selectedMatch.matchedUser?.id) ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                              Active now
                            </span>
                          ) : (
                            `${selectedMatch.matchedUser?.department} • ${selectedMatch.matchedUser?.year} Year`
                          )}
                        </p>
                      </div>
                      {/* Options Menu */}
                      <div className="flex items-center gap-1">
                        {!selectedMatch.isBlocked && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${selectedMatch.matchedUser?.name} from friends?`)) {
                                removeFriend(selectedMatch.matchedUser?.id)
                                setIsMobileChatOpen(false)
                              }
                            }}
                            className="text-white hover:bg-white/20 p-2"
                            title="Remove Friend"
                          >
                            <UserMinus className="h-5 w-5" />
                          </Button>
                        )}
                        
                        {selectedMatch.isBlocked && selectedMatch.blockedBy === 'me' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Unblock ${selectedMatch.matchedUser?.name}?`)) {
                                try {
                                  const response = await fetch('/api/unblock-user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      blockerId: currentUser.id,
                                      blockedId: selectedMatch.matchedUser?.id
                                    })
                                  })
                                  if (response.ok) {
                                    toast.success('User unblocked!')
                                    setBlockedUsers(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(selectedMatch.matchedUser?.id)
                                      return newSet
                                    })
                                    setBlockedUsersList(prev => prev.filter(u => u.id !== selectedMatch.matchedUser?.id))
                                    loadMatches(currentUser.id)
                                  } else {
                                    toast.error('Failed to unblock')
                                  }
                                } catch (error) {
                                  toast.error('Error unblocking')
                                }
                              }
                            }}
                            className="text-white hover:bg-white/20 p-2"
                            title="Unblock"
                          >
                            <UserPlus className="h-5 w-5" />
                          </Button>
                        ) : !selectedMatch.isBlocked && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Block ${selectedMatch.matchedUser?.name}?`)) {
                                blockUser(selectedMatch.matchedUser?.id)
                              }
                            }}
                            className="text-white hover:bg-white/20 p-2"
                            title="Block"
                          >
                            <UserX className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages Area */}
                  {selectedMatch.isBlocked ? (
                    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                      <div className="text-center max-w-sm">
                        <UserX className="h-20 w-20 mx-auto text-red-400 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          Can't Chat
                        </h3>
                        <p className="text-gray-600">
                          {selectedMatch.blockedBy === 'them' ? (
                            <>This user has blocked you.</>
                          ) : (
                            <>You have blocked this user.</>
                          )}
                        </p>
                        {selectedMatch.blockedBy === 'me' && (
                          <Button
                            onClick={async () => {
                              if (confirm(`Unblock ${selectedMatch.matchedUser?.name}?`)) {
                                try {
                                  const response = await fetch('/api/unblock-user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      blockerId: currentUser.id,
                                      blockedId: selectedMatch.matchedUser?.id
                                    })
                                  })
                                  if (response.ok) {
                                    toast.success('Unblocked!')
                                    setBlockedUsers(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(selectedMatch.matchedUser?.id)
                                      return newSet
                                    })
                                    setBlockedUsersList(prev => prev.filter(u => u.id !== selectedMatch.matchedUser?.id))
                                    loadMatches(currentUser.id)
                                  }
                                } catch (error) {
                                  toast.error('Error')
                                }
                              }
                            }}
                            className="mt-4 bg-purple-500 hover:bg-purple-600"
                          >
                            Unblock User
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div id="mobile-chat-messages" className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
                        <div className="space-y-4">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-12">
                              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg">No messages yet</p>
                              <p className="text-sm mt-1">Say hi! 👋</p>
                            </div>
                          ) : (
                            messages.map((msg, index) => {
                              const isCurrentUser = msg.senderId === currentUser.id
                              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId
                              const showDateSeparator = shouldShowDateSeparator(msg, messages[index - 1])
                              
                              return (
                                <div key={msg.id}>
                                  {/* Date Separator */}
                                  {showDateSeparator && (
                                    <div className="flex items-center justify-center my-4">
                                      <div className="bg-white shadow-sm text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full border border-gray-200">
                                        {formatMessageDate(msg.createdAt)}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Message */}
                                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                      {showAvatar && !isCurrentUser && (
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                          <AvatarImage src={selectedMatch.matchedUser?.photo_url} />
                                          <AvatarFallback className="text-xs">
                                            {selectedMatch.matchedUser?.name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      {showAvatar && isCurrentUser && (
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                          <AvatarImage src={currentUser?.photo_url} />
                                          <AvatarFallback className="text-xs">
                                            {currentUser?.name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      {!showAvatar && <div className="w-8 flex-shrink-0"></div>}
                                    
                                    <div 
                                      className={`rounded-2xl px-4 py-2.5 ${
                                        isCurrentUser 
                                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                                          : 'bg-white text-gray-900 shadow-sm'
                                      }`}
                                    >
                                      <p className="break-words text-sm leading-relaxed">{msg.message}</p>
                                      <p className={`text-xs mt-1 ${
                                        isCurrentUser ? 'text-pink-100' : 'text-gray-400'
                                      }`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                          {isTyping && (
                            <div className="flex justify-start">
                              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Input */}
                      <div className="border-t bg-white p-4 shadow-lg">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => {
                              setMessageInput(e.target.value)
                              handleTyping()
                            }}
                            className="flex-1 rounded-full border-2 border-gray-200 focus:border-purple-400 px-4"
                          />
                          <Button 
                            type="submit"
                            disabled={!messageInput.trim()}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full h-11 w-11 p-0"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center mb-8">Your Friends</h2>
                  {matches.length === 0 ? (
                    <Card className="p-12">
                      <div className="text-center text-gray-500">
                        <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-xl">No friends yet</p>
                        <p className="text-sm mt-2">Start liking profiles to find your match!</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Friend List - Scrollable Container */}
                      <div className="lg:col-span-1 space-y-4 lg:h-[600px] lg:overflow-y-auto lg:pr-2 scroll-smooth">
                        {matches.map((match) => {
                          const isOnline = onlineUsers.has(match.matchedUser?.id)
                          const hasUnread = unreadMessages.has(match.id)
                          return (
                            <Card 
                              key={match.id}
                              className={`cursor-pointer hover:shadow-lg transition-all ${selectedMatch?.id === match.id ? 'ring-2 ring-purple-500' : ''}`}
                              onClick={() => {
                                // Clear messages before switching to prevent cross-chat contamination
                                setMessages([])
                                
                                // Check if mobile view
                                if (window.innerWidth < 1024) {
                                  setSelectedMatch(match)
                                  setIsMobileChatOpen(true)
                                } else {
                                  setSelectedMatch(match)
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={match.matchedUser?.photo_url} />
                                      <AvatarFallback>{match.matchedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    {/* Online status indicator */}
                                    {isOnline && (
                                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold">{match.matchedUser?.name}</h3>
                                    <p className="text-xs text-gray-500">
                                      {isOnline ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                                          Online
                                        </span>
                                      ) : (
                                        match.matchedUser?.department || 'Student'
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Blue dot for unread messages */}
                                    {hasUnread && (
                                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                    )}
                                    <MessageCircle className="h-5 w-5 text-purple-500" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Chat Area - Desktop Only */}
                      <div className="hidden lg:block lg:col-span-2">
                        {selectedMatch ? (
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage src={selectedMatch.matchedUser?.photo_url} />
                                  <AvatarFallback>{selectedMatch.matchedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                {/* Online status indicator */}
                                {onlineUsers.has(selectedMatch.matchedUser?.id) && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                )}
                              </div>
                              <div>
                                <CardTitle>{selectedMatch.matchedUser?.name}</CardTitle>
                                <CardDescription>
                                  {onlineUsers.has(selectedMatch.matchedUser?.id) ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                                      Active now
                                    </span>
                                  ) : (
                                    `${selectedMatch.matchedUser?.department} • ${selectedMatch.matchedUser?.year} Year`
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Show Remove Friend only if not blocked */}
                              {!selectedMatch.isBlocked && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Remove ${selectedMatch.matchedUser?.name} from friends? You can send them a friend request again later from the Discover tab.`)) {
                                      removeFriend(selectedMatch.matchedUser?.id)
                                    }
                                  }}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Remove Friend"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Show Block/Unblock button based on status */}
                              {selectedMatch.isBlocked && selectedMatch.blockedBy === 'me' ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm(`Unblock ${selectedMatch.matchedUser?.name}? You will be able to chat normally again.`)) {
                                      try {
                                        const response = await fetch('/api/unblock-user', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            blockerId: currentUser.id,
                                            blockedId: selectedMatch.matchedUser?.id
                                          })
                                        })
                                        if (response.ok) {
                                          toast.success('User unblocked - You can chat now!')
                                          setBlockedUsers(prev => {
                                            const newSet = new Set(prev)
                                            newSet.delete(selectedMatch.matchedUser?.id)
                                            return newSet
                                          })
                                          loadMatches(currentUser.id)
                                        } else {
                                          toast.error('Failed to unblock user')
                                        }
                                      } catch (error) {
                                        toast.error('Failed to unblock user')
                                      }
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Unblock User"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              ) : !selectedMatch.isBlocked && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Block ${selectedMatch.matchedUser?.name}? You won't be able to chat anymore.`)) {
                                      blockUser(selectedMatch.matchedUser?.id)
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Block User"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedMatch(null)}
                                title="Close Chat"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {/* Check if blocked */}
                        {selectedMatch.isBlocked ? (
                          <CardContent className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-md">
                              <div className="mb-6">
                                <UserX className="h-20 w-20 mx-auto text-red-400 mb-4" />
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                  You Can't Chat Anymore
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                  {selectedMatch.blockedBy === 'them' ? (
                                    <>
                                      <strong>{selectedMatch.matchedUser?.name}</strong> has blocked you.
                                      <br />
                                      You cannot send or receive messages from this user.
                                    </>
                                  ) : (
                                    <>
                                      You have blocked <strong>{selectedMatch.matchedUser?.name}</strong>.
                                      <br />
                                      No messages can be sent or received.
                                    </>
                                  )}
                                </p>
                              </div>
                              {selectedMatch.blockedBy === 'me' && (
                                <Button
                                  onClick={async () => {
                                    if (confirm(`Unblock ${selectedMatch.matchedUser?.name}?`)) {
                                      try {
                                        const response = await fetch('/api/unblock-user', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            blockerId: currentUser.id,
                                            blockedId: selectedMatch.matchedUser?.id
                                          })
                                        })
                                        if (response.ok) {
                                          toast.success('User unblocked')
                                          setBlockedUsers(prev => {
                                            const newSet = new Set(prev)
                                            newSet.delete(selectedMatch.matchedUser?.id)
                                            return newSet
                                          })
                                          loadMatches(currentUser.id)
                                        } else {
                                          toast.error('Failed to unblock user')
                                        }
                                      } catch (error) {
                                        toast.error('Failed to unblock user')
                                      }
                                    }
                                  }}
                                  variant="outline"
                                  className="border-2 border-purple-400 text-purple-600 hover:bg-purple-50"
                                >
                                  Unblock User
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        ) : (
                          <>
                            <CardContent id="chat-messages" className="flex-1 overflow-y-auto p-4 scroll-smooth">
                          <div className="space-y-4">
                            {messages.length === 0 ? (
                              <div className="text-center text-gray-500 py-12">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No messages yet. Say hi! 👋</p>
                              </div>
                            ) : (
                              messages.map((msg, index) => {
                                const isCurrentUser = msg.senderId === currentUser.id
                                const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId
                                const showDateSeparator = shouldShowDateSeparator(msg, messages[index - 1])
                                
                                return (
                                  <div key={msg.id}>
                                    {/* Date Separator */}
                                    {showDateSeparator && (
                                      <div className="flex items-center justify-center my-4">
                                        <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                                          {formatMessageDate(msg.createdAt)}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Message */}
                                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {showAvatar && !isCurrentUser && (
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedMatch.matchedUser?.photo_url} />
                                            <AvatarFallback className="text-xs">
                                              {selectedMatch.matchedUser?.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        {showAvatar && isCurrentUser && (
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={currentUser?.photo_url} />
                                            <AvatarFallback className="text-xs">
                                              {currentUser?.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        {!showAvatar && <div className="w-8"></div>}
                                      
                                      <div 
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                          isCurrentUser 
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                                            : 'bg-gray-200 text-gray-900'
                                        }`}
                                      >
                                        <p className="break-words">{msg.message}</p>
                                        <p className={`text-xs mt-1 ${
                                          isCurrentUser ? 'text-pink-100' : 'text-gray-500'
                                        }`}>
                                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                            {/* Typing indicator */}
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="bg-gray-200 rounded-2xl px-4 py-3">
                                  <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className="border-t p-4">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={(e) => {
                                setMessageInput(e.target.value)
                                handleTyping()
                              }}
                              className="flex-1"
                            />
                            <Button 
                              type="submit"
                              disabled={!messageInput.trim()}
                              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                          </>
                        )}
                      </Card>
                    ) : (
                      <Card className="h-[600px] flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-xl">Select a match to start chatting</p>
                        </div>
                      </Card>
                    )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Blocked Users Tab */}
          <TabsContent value="blocked">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 mb-2">
                  Blocked Users
                </h2>
                <p className="text-gray-600">Users you have blocked</p>
              </div>

              {blockedUsersList.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <UserX className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold">No blocked users</p>
                    <p className="text-sm mt-2">You haven't blocked anyone yet</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {blockedUsersList.map((user) => (
                    <Card 
                      key={user.id} 
                      className="hover:shadow-xl transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          {/* Profile Photo */}
                          <Avatar className="h-20 w-20 border-4 border-gray-200">
                            <AvatarImage src={user.photo_url} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                              {user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Profile Info */}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-1 text-gray-900">
                              {user.name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                              </p>
                              <p className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {user.department} • {user.year} Year
                              </p>
                            </div>
                          </div>

                          {/* Unblock Button */}
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={async () => {
                                if (confirm(`Unblock ${user.name}? You will be able to interact with them again.`)) {
                                  try {
                                    const response = await fetch('/api/unblock-user', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        blockerId: currentUser.id,
                                        blockedId: user.id
                                      })
                                    })
                                    if (response.ok) {
                                      toast.success(`${user.name} unblocked successfully`)
                                      setBlockedUsers(prev => {
                                        const newSet = new Set(prev)
                                        newSet.delete(user.id)
                                        return newSet
                                      })
                                      loadBlockedUsers(currentUser.id)
                                      loadMatches(currentUser.id)
                                    } else {
                                      toast.error('Failed to unblock user')
                                    }
                                  } catch (error) {
                                    toast.error('Failed to unblock user')
                                  }
                                }
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Unblock
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Full Profile Modal - Works for all tabs */}
        {showProfileModal && selectedProfile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeProfileView}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with photo */}
              <div className="relative h-80 bg-gradient-to-br from-pink-200 to-purple-200">
                {selectedProfile.photo_url ? (
                  <img 
                    src={selectedProfile.photo_url} 
                    alt={selectedProfile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <User className="h-32 w-32 text-gray-400" />
                  </div>
                )}

                {/* Gradient overlay for text visibility */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Name and basic info overlay */}
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
                    {selectedProfile.name}
                  </h1>
                  {selectedProfile.department && selectedProfile.year && (
                    <p className="text-lg opacity-95 drop-shadow-md">
                      📚 {selectedProfile.department} • {selectedProfile.year} Year
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Bio */}
                {selectedProfile.bio && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-2xl">💭</span>
                      About
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProfile.bio}</p>
                  </div>
                )}

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.interests.map((interest, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-sm px-4 py-2"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email */}
                {selectedProfile.email && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-2xl">📧</span>
                      Contact
                    </h3>
                    <p className="text-gray-600">{selectedProfile.email}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={closeProfileView}
                    variant="outline"
                    className="flex-1 border-2"
                  >
                    Close
                  </Button>
                  {likedProfiles.has(selectedProfile.id) ? (
                    <Button 
                      disabled
                      className="flex-1 bg-gray-400 cursor-not-allowed"
                    >
                      <Heart className="h-5 w-5 mr-2 fill-white" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button 
                      onClick={async () => {
                        await sendFriendRequest(selectedProfile.id)
                        closeProfileView()
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-base py-6"
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Send Friend Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
