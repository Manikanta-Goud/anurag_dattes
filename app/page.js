'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, User, LogOut, X, Send, Sparkles, Users, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('landing') // landing, auth, profile-setup, main, profile
  const [authMode, setAuthMode] = useState('login') // login, signup
  const [profiles, setProfiles] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (user) {
      setCurrentUser(JSON.parse(user))
      setView('main')
      loadProfiles(JSON.parse(user).id)
      loadMatches(JSON.parse(user).id)
    }
  }, [])

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id)
      // Poll for new messages every 1 second for real-time chat
      const interval = setInterval(() => {
        loadMessages(selectedMatch.id)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [selectedMatch])

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
      if (authMode === 'signup') {
        // Validate email domain
        if (!authForm.email.endsWith('@anurag.edu.in')) {
          toast.error('Only @anurag.edu.in email addresses are allowed!')
          setLoading(false)
          return
        }

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
          toast.error(data.error || 'Signup failed')
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
          setView('main')
          loadProfiles(data.user.id)
          loadMatches(data.user.id)
        } else {
          toast.error(data.error || 'Login failed')
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
        toast.info('Uploading photo...')
        finalPhotoUrl = await uploadPhotoToServer(profileForm.photo_url)
        if (!finalPhotoUrl) {
          setLoading(false)
          return
        }
      }

      const interestsArray = profileForm.interests.split(',').map(i => i.trim()).filter(i => i)
      
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
        toast.success('Profile created successfully!')
        setCurrentUser({ ...currentUser, ...data.profile })
        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...data.profile }))
        setView('main')
        loadProfiles(currentUser.id)
      } else {
        toast.error(data.error || 'Failed to create profile')
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
        setProfiles(data.profiles || [])
        
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

  const loadMessages = async (matchId) => {
    try {
      const response = await fetch(`/api/messages?matchId=${matchId}`)
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages || [])
        // Auto scroll to bottom
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-messages')
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight
          }
        }, 100)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
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
        loadMessages(selectedMatch.id)
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
    setLoading(true)

    try {
      // Upload photo if it's a base64 preview
      let finalPhotoUrl = profileForm.photo_url
      if (profileForm.photo_url && !profileForm.photo_url.startsWith('http')) {
        toast.info('Uploading photo...')
        finalPhotoUrl = await uploadPhotoToServer(profileForm.photo_url)
        if (!finalPhotoUrl) {
          setLoading(false)
          return
        }
      }

      const interestsArray = profileForm.interests.split(',').map(i => i.trim()).filter(i => i)
      
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
        toast.success('Profile updated successfully!')
        const updatedUser = { ...currentUser, ...data.profile }
        setCurrentUser(updatedUser)
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        setIsEditingProfile(false)
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }

    setLoading(false)
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

    try {
      // Convert base64 to blob
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      
      // Upload to imgbb
      const formData = new FormData()
      formData.append('image', blob)
      
      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=dca0e0c77c2e6c435e54502aa4973a94', {
        method: 'POST',
        body: formData
      })

      const data = await uploadResponse.json()

      if (data.success) {
        setUploadingPhoto(false)
        return data.data.url
      } else {
        setUploadingPhoto(false)
        toast.error('Failed to upload photo')
        return null
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      setUploadingPhoto(false)
      toast.error('Failed to upload photo')
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
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
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="studentid@anurag.edu.in"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
                {authMode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Only @anurag.edu.in emails allowed</p>
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
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                          Photo ready! Click "Save Changes" to upload
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                        disabled={loading}
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
              <button 
                onClick={openMyProfile}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <Avatar className="cursor-pointer">
                  <AvatarImage src={currentUser?.photo_url} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{currentUser?.name}</span>
              </button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4">Discover Students</h2>
              
              {currentProfileIndex >= profiles.length ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No more profiles to show</p>
                    <p className="text-sm mt-2">Check back later for new students!</p>
                    <Button 
                      onClick={() => setCurrentProfileIndex(0)}
                      className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      Start Over
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="relative pb-4">
                  {/* Swipe Instructions */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      Swipe right 💚 to send request • Swipe left ❌ to pass
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Profile {currentProfileIndex + 1} of {profiles.length}
                    </p>
                  </div>

                  {/* Swipe Card Container */}
                  <div className="relative min-h-[550px] flex items-center justify-center mb-6">
                    {profiles[currentProfileIndex] && (
                      <Card 
                        className={`w-full max-w-md mx-auto overflow-hidden shadow-2xl transition-all duration-300 ${
                          swipeDirection === 'left' ? 'translate-x-[-150%] rotate-[-20deg] opacity-0' :
                          swipeDirection === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' :
                          'translate-x-0 rotate-0 opacity-100'
                        }`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {/* Photo Section */}
                        <div className="relative h-[400px] bg-gradient-to-br from-pink-200 to-purple-200">
                          {profiles[currentProfileIndex].photo_url ? (
                            <img 
                              src={profiles[currentProfileIndex].photo_url} 
                              alt={profiles[currentProfileIndex].name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <User className="h-32 w-32 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          
                          {/* Info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">
                              {profiles[currentProfileIndex].name}
                              {profiles[currentProfileIndex].year && (
                                <span className="text-xl ml-2 opacity-90">, {profiles[currentProfileIndex].year}</span>
                              )}
                            </h2>
                            {profiles[currentProfileIndex].department && (
                              <p className="text-base opacity-95 drop-shadow-md">
                                📚 {profiles[currentProfileIndex].department}
                              </p>
                            )}
                          </div>

                          {/* Already liked badge */}
                          {likedProfiles.has(profiles[currentProfileIndex].id) && (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                              ✓ Request Sent
                            </div>
                          )}
                        </div>

                        {/* Quick Info Section */}
                        <CardContent className="p-4 bg-white">
                          {/* Bio Preview */}
                          {profiles[currentProfileIndex].bio && (
                            <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                              {profiles[currentProfileIndex].bio}
                            </p>
                          )}

                          {/* Interests Preview */}
                          {profiles[currentProfileIndex].interests && profiles[currentProfileIndex].interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {profiles[currentProfileIndex].interests.slice(0, 4).map((interest, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1"
                                >
                                  {interest}
                                </Badge>
                              ))}
                              {profiles[currentProfileIndex].interests.length > 4 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  +{profiles[currentProfileIndex].interests.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center items-center gap-8">
                    {/* Pass Button */}
                    <button
                      onClick={handleSwipeLeft}
                      className="w-16 h-16 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-red-200 hover:border-red-400 hover:scale-110 active:scale-95 flex items-center justify-center group"
                      aria-label="Pass"
                    >
                      <X className="h-8 w-8 text-red-500 group-hover:text-red-600" strokeWidth={2.5} />
                    </button>

                    {/* Info Button */}
                    <button
                      onClick={() => openProfileView(profiles[currentProfileIndex])}
                      className="w-14 h-14 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-blue-200 hover:border-blue-400 hover:scale-110 active:scale-95 flex items-center justify-center group"
                      aria-label="View Profile"
                    >
                      <User className="h-6 w-6 text-blue-500 group-hover:text-blue-600" strokeWidth={2.5} />
                    </button>

                    {/* Like Button */}
                    <button
                      onClick={handleSwipeRight}
                      disabled={likedProfiles.has(profiles[currentProfileIndex]?.id)}
                      className={`w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all border-2 active:scale-95 flex items-center justify-center group ${
                        likedProfiles.has(profiles[currentProfileIndex]?.id)
                          ? 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-60'
                          : 'bg-white border-green-200 hover:border-green-400 hover:scale-110'
                      }`}
                      aria-label="Like"
                    >
                      <Heart className={`h-8 w-8 ${
                        likedProfiles.has(profiles[currentProfileIndex]?.id)
                          ? 'text-gray-500 fill-gray-500'
                          : 'text-green-500 group-hover:text-green-600 group-hover:fill-green-500'
                      }`} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Keyboard shortcuts hint */}
                  <div className="text-center mt-4 text-xs text-gray-400">
                    <p>💡 Use ← → arrow keys or swipe on mobile</p>
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
                    
                    {/* Close button */}
                    <button
                      onClick={closeProfileView}
                      className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-700" />
                    </button>

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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
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
                            await handleLike(selectedProfile.id)
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
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Your Matches</h2>
              {matches.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No matches yet</p>
                    <p className="text-sm mt-2">Start liking profiles to find your match!</p>
                  </div>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Match List */}
                  <div className="lg:col-span-1 space-y-4">
                    {matches.map((match) => {
                      const isOnline = onlineUsers.has(match.matchedUser?.id)
                      return (
                        <Card 
                          key={match.id}
                          className={`cursor-pointer hover:shadow-lg transition-all ${selectedMatch?.id === match.id ? 'ring-2 ring-purple-500' : ''}`}
                          onClick={() => setSelectedMatch(match)}
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
                              <MessageCircle className="h-5 w-5 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2">
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMatch(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent id="chat-messages" className="flex-1 overflow-y-auto p-4">
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
                                
                                return (
                                  <div 
                                    key={msg.id}
                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                  >
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
