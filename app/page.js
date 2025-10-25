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
  const [view, setView] = useState('landing') // landing, auth, profile-setup, main
  const [authMode, setAuthMode] = useState('login') // login, signup
  const [profiles, setProfiles] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)

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
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedMatch.id)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedMatch])

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
      const interestsArray = profileForm.interests.split(',').map(i => i.trim()).filter(i => i)
      
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...profileForm,
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
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
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
          toast.success('Like sent!')
        }
        // Remove liked profile from list
        setProfiles(profiles.filter(p => p.id !== profileId))
      } else {
        toast.error(data.error || 'Failed to like')
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          senderId: currentUser.id,
          message: messageInput
        })
      })

      if (response.ok) {
        setMessageInput('')
        loadMessages(selectedMatch.id)
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setView('landing')
    toast.success('Logged out successfully')
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
                <label className="text-sm font-medium mb-2 block">Photo URL (optional)</label>
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={profileForm.photo_url}
                  onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })}
                />
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
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={currentUser?.photo_url} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{currentUser?.name}</span>
              </div>
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
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Discover Students</h2>
              {profiles.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No more profiles to show</p>
                    <p className="text-sm mt-2">Check back later for new students!</p>
                  </div>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map((profile) => (
                    <Card key={profile.id} className="overflow-hidden hover:shadow-xl transition-all">
                      <div className="h-64 bg-gradient-to-br from-pink-200 to-purple-200 relative">
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-24 w-24 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-bold mb-2">{profile.name}</h3>
                        {profile.department && profile.year && (
                          <p className="text-sm text-gray-600 mb-2">
                            {profile.department} • {profile.year} Year
                          </p>
                        )}
                        {profile.bio && (
                          <p className="text-gray-700 mb-3 line-clamp-2">{profile.bio}</p>
                        )}
                        {profile.interests && profile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {profile.interests.slice(0, 3).map((interest, idx) => (
                              <Badge key={idx} variant="secondary">{interest}</Badge>
                            ))}
                          </div>
                        )}
                        <Button 
                          onClick={() => handleLike(profile.id)}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Like
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
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
                    {matches.map((match) => (
                      <Card 
                        key={match.id}
                        className={`cursor-pointer hover:shadow-lg transition-all ${selectedMatch?.id === match.id ? 'ring-2 ring-purple-500' : ''}`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={match.matchedUser?.photo_url} />
                              <AvatarFallback>{match.matchedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">{match.matchedUser?.name}</h3>
                              <p className="text-xs text-gray-500">
                                {match.matchedUser?.department || 'Student'}
                              </p>
                            </div>
                            <MessageCircle className="h-5 w-5 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Chat Area */}
                  <div className="lg:col-span-2">
                    {selectedMatch ? (
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={selectedMatch.matchedUser?.photo_url} />
                                <AvatarFallback>{selectedMatch.matchedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle>{selectedMatch.matchedUser?.name}</CardTitle>
                                <CardDescription>
                                  {selectedMatch.matchedUser?.department} • {selectedMatch.matchedUser?.year} Year
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
                        <CardContent className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-4">
                            {messages.length === 0 ? (
                              <div className="text-center text-gray-500 py-12">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No messages yet. Say hi! 👋</p>
                              </div>
                            ) : (
                              messages.map((msg) => (
                                <div 
                                  key={msg.id}
                                  className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div 
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                      msg.senderId === currentUser.id 
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                                        : 'bg-gray-200 text-gray-900'
                                    }`}
                                  >
                                    <p>{msg.message}</p>
                                    <p className={`text-xs mt-1 ${
                                      msg.senderId === currentUser.id ? 'text-pink-100' : 'text-gray-500'
                                    }`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                        <div className="border-t p-4">
                          <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              type="submit"
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
