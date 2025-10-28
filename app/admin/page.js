'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, MessageSquare, Heart, TrendingUp, Eye, LogOut, Search, Clock, Mail, AlertTriangle, X, User, Ban, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // Admin data
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Profile and warning modals
  const [selectedUserProfile, setSelectedUserProfile] = useState(null)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [sendingWarning, setSendingWarning] = useState(false)
  
  // Ban user modal
  const [showBanModal, setShowBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banningUser, setBanningUser] = useState(false)
  
  // Delete user modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingUser, setDeletingUser] = useState(false)
  
  // Banned users
  const [bannedUsers, setBannedUsers] = useState([])
  const [unbanningUserId, setUnbanningUserId] = useState(null)

  // Check if admin is logged in
  useEffect(() => {
    const admin = localStorage.getItem('admin')
    if (admin) {
      setIsAuthenticated(true)
      loadAdminData()
    }
  }, [])

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        loadAdminData()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('admin', JSON.stringify(data.admin))
        setIsAuthenticated(true)
        loadAdminData()
        toast.success('Admin login successful!')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  const loadAdminData = async () => {
    try {
      // Load stats
      const statsRes = await fetch('/api/admin/stats')
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Load users
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      setUsers(usersData.users)

      // Load conversations
      const convRes = await fetch('/api/admin/conversations')
      const convData = await convRes.json()
      setConversations(convData.conversations)
      
      // Load banned users
      const bannedRes = await fetch('/api/admin/banned-users')
      const bannedData = await bannedRes.json()
      setBannedUsers(bannedData.bannedUsers || [])
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const loadConversationMessages = async (matchId) => {
    try {
      const response = await fetch(`/api/messages?matchId=${matchId}`)
      const data = await response.json()
      if (response.ok) {
        setConversationMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const viewConversation = (conversation) => {
    setSelectedConversation(conversation)
    loadConversationMessages(conversation.matchId)
  }

  const openUserProfile = (user) => {
    setSelectedUserProfile(user)
  }

  const closeUserProfile = () => {
    setSelectedUserProfile(null)
  }

  const openWarningModal = (user) => {
    setSelectedUserProfile(user)
    setShowWarningModal(true)
    setWarningMessage('')
  }

  const closeWarningModal = () => {
    setShowWarningModal(false)
    setWarningMessage('')
  }

  const sendWarning = async () => {
    if (!warningMessage.trim()) {
      toast.error('Please enter a warning message')
      return
    }

    setSendingWarning(true)
    try {
      const response = await fetch('/api/admin/send-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserProfile.id,
          message: warningMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.autoBanned) {
          toast.success(`⚠️ ${selectedUserProfile.name} has been AUTOMATICALLY BANNED after receiving ${data.warningCount} warnings!`, {
            duration: 6000
          })
        } else if (data.warningCount >= 3) {
          toast.warning(`Warning sent! ${selectedUserProfile.name} now has ${data.warningCount} warnings. Will be auto-banned at 5 warnings.`, {
            duration: 5000
          })
        } else {
          toast.success(`Warning sent to ${selectedUserProfile.name} (${data.warningCount} total warnings)`)
        }
        closeWarningModal()
        closeUserProfile()
        // Reload admin data to update banned users list if auto-banned
        if (data.autoBanned) {
          loadAdminData()
        }
      } else {
        toast.error(data.error || 'Failed to send warning')
      }
    } catch (error) {
      toast.error('Error sending warning: ' + error.message)
    } finally {
      setSendingWarning(false)
    }
  }

  const openBanModal = (user) => {
    setSelectedUserProfile(user)
    setShowBanModal(true)
    setBanReason('')
  }

  const closeBanModal = () => {
    setShowBanModal(false)
    setBanReason('')
  }

  const banUser = async () => {
    if (!banReason.trim()) {
      toast.error('Please enter a reason for banning')
      return
    }

    setBanningUser(true)
    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserProfile.id,
          reason: banReason,
          bannedBy: 'admin' // In production, use actual admin username
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`${selectedUserProfile.name} has been banned`)
        closeBanModal()
        closeUserProfile()
        loadAdminData() // Refresh user list
      } else {
        toast.error(data.error || 'Failed to ban user')
      }
    } catch (error) {
      toast.error('Error banning user: ' + error.message)
    } finally {
      setBanningUser(false)
    }
  }

  const unbanUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to unban ${userName}? They will be able to log in again.`)) {
      return
    }

    setUnbanningUserId(userId)
    
    try {
      // Show loading toast
      const loadingToast = toast.loading(`Unbanning ${userName}...`)
      
      const response = await fetch('/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`✅ ${userName} has been unbanned successfully!`, { id: loadingToast })
        
        // Optimistically remove from banned users list immediately
        setBannedUsers(prev => prev.filter(ban => ban.userid !== userId))
        
        // Refresh full data in background
        loadAdminData()
      } else {
        toast.error(data.error || 'Failed to unban user', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Error unbanning user: ' + error.message)
    } finally {
      setUnbanningUserId(null)
    }
  }

  const openDeleteModal = (user) => {
    setSelectedUserProfile(user)
    setShowDeleteModal(true)
    setDeletePassword('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletePassword('')
  }

  const deleteUser = async () => {
    if (!deletePassword.trim()) {
      toast.error('Please enter admin password to confirm deletion')
      return
    }

    if (!confirm(`⚠️ PERMANENT DELETION WARNING!\n\nThis will permanently delete ${selectedUserProfile.name} and ALL their data including:\n• Profile\n• Messages\n• Matches\n• Likes\n• Warnings\n• Ban records\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return
    }

    setDeletingUser(true)
    try {
      const loadingToast = toast.loading(`Deleting ${selectedUserProfile.name}...`)
      
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserProfile.id,
          adminPassword: deletePassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`✅ ${selectedUserProfile.name} has been permanently deleted!`, { id: loadingToast })
        closeDeleteModal()
        closeUserProfile()
        closeBanModal()
        loadAdminData() // Refresh all data
      } else {
        toast.error(data.error || 'Failed to delete user', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Error deleting user: ' + error.message)
    } finally {
      setDeletingUser(false)
    }
  }

  // Filter users based on search
  const filteredUsers = (users || []).filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl text-white">Admin Panel</CardTitle>
            <CardDescription className="text-gray-400">Anurag Connect Administration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Username</label>
                <Input
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Default credentials: admin / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-purple-100">Anurag Connect Administration</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="border-white text-white hover:bg-white/20">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.onlineUsers} online now</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.totalMatches}</div>
                <p className="text-xs text-gray-500 mt-1">Active connections</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.totalMessages}</div>
                <p className="text-xs text-gray-500 mt-1">Conversations</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Total Likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-600">{stats.totalLikes}</div>
                <p className="text-xs text-gray-500 mt-1">Interest shown</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  New Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats?.newUsers?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="new">New Users</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="banned">Banned Users</TabsTrigger>
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View and manage all registered users</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        {/* User Info Section */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative cursor-pointer" onClick={() => openUserProfile(user)}>
                            <Avatar className="h-12 w-12 hover:ring-2 hover:ring-purple-400 transition-all">
                              <AvatarImage src={user.photo_url} />
                              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold flex items-center gap-2">
                              {user.name}
                              {user.isOnline && <Badge variant="outline" className="text-xs text-green-600 border-green-600">Online</Badge>}
                            </h3>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {user.department} • {user.year} Year • Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Stats Section */}
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-purple-600">{user.matchCount}</div>
                            <div className="text-xs text-gray-500">Matches</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{user.likesSent}</div>
                            <div className="text-xs text-gray-500">Sent</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-pink-600">{user.likesReceived}</div>
                            <div className="text-xs text-gray-500">Received</div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                          onClick={() => openUserProfile(user)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          onClick={() => openWarningModal(user)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Button>
                        <Button
                          onClick={() => openBanModal(user)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(user)}
                          size="sm"
                          variant="destructive"
                          className="flex-1 bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-black"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Users Tab */}
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>Recently Joined Users</CardTitle>
                <CardDescription>Users who joined in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.newUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.photo_url} />
                          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {user.name}
                            <Badge className="bg-green-600">New</Badge>
                          </h3>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.department} • {user.year} Year
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          Joined {new Date(user.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats?.newUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No new users in the last 7 days</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Active Conversations</CardTitle>
                  <CardDescription>
                    {conversations?.length || 0} total matches
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-2">
                    {(conversations || []).map((conv) => (
                      <div
                        key={conv.matchId}
                        className={`p-4 border rounded-lg transition-colors ${
                          selectedConversation?.matchId === conv.matchId ? 'bg-purple-100 border-purple-300' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-purple-200">
                              <AvatarImage src={conv.user1?.photo_url} />
                              <AvatarFallback className="text-sm font-medium bg-purple-100">{conv.user1?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {conv.user1Online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                          </div>
                          <span className="text-sm">↔️</span>
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-purple-200">
                              <AvatarImage src={conv.user2?.photo_url} />
                              <AvatarFallback className="text-sm font-medium bg-purple-100">{conv.user2?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {conv.user2Online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                          </div>
                        </div>
                        <div className="text-sm font-medium cursor-pointer hover:text-purple-600" onClick={() => viewConversation(conv)}>
                          {conv.user1?.name} & {conv.user2?.name}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {conv.messageCount} messages
                          </Badge>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Messages View */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedConversation ? (
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5" />
                        Viewing Conversation
                      </div>
                    ) : (
                      'Select a conversation to view'
                    )}
                  </CardTitle>
                  {selectedConversation && (
                    <CardDescription>
                      Between {selectedConversation.user1?.name} and {selectedConversation.user2?.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {(conversationMessages || []).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No messages yet in this conversation</p>
                        </div>
                      ) : (
                        (conversationMessages || []).map((msg) => {
                          const isSender1 = msg.senderId === selectedConversation.user1?.id
                          const sender = isSender1 ? selectedConversation.user1 : selectedConversation.user2
                          
                          return (
                            <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender?.photo_url} />
                                <AvatarFallback className="text-xs">{sender?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{sender?.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{msg.message}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Select a conversation to view messages</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Banned Users Tab */}
          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Ban className="h-5 w-5" />
                  Banned Users
                </CardTitle>
                <CardDescription>
                  Users who have been banned from the platform. You can unban them here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bannedUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Ban className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No banned users</p>
                      <p className="text-sm">All users are currently in good standing</p>
                    </div>
                  ) : (
                    bannedUsers.map((ban) => (
                      <div key={ban.id} className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 border-2 border-red-300">
                              <AvatarImage src={ban.user?.photo_url} />
                              <AvatarFallback className="bg-red-200">{ban.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{ban.user?.name || 'Unknown User'}</h3>
                                <Badge variant="destructive" className="text-xs">BANNED</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{ban.user?.email}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {ban.user?.department} • {ban.user?.year} Year
                              </p>
                              
                              {/* Ban Details */}
                              <div className="mt-3 p-3 bg-white rounded border border-red-200">
                                <div className="text-xs text-gray-500 mb-1">Ban Reason:</div>
                                <p className="text-sm font-medium text-red-800">{ban.reason}</p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                  <span>Banned by: {ban.bannedBy}</span>
                                  <span>Date: {new Date(ban.bannedAt).toLocaleDateString()}</span>
                                  <span>Time: {new Date(ban.bannedAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Unban Button */}
                          <Button
                            onClick={() => unbanUser(ban.userId, ban.user?.name)}
                            disabled={unbanningUserId === ban.userId}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {unbanningUserId === ban.userId ? 'Unbanning...' : 'Unban User'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Profile Modal */}
      {selectedUserProfile && !showWarningModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeUserProfile}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="relative">
              <button
                onClick={closeUserProfile}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUserProfile.photo_url} />
                  <AvatarFallback className="text-2xl">{selectedUserProfile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{selectedUserProfile.name}</CardTitle>
                  <CardDescription className="text-base">{selectedUserProfile.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg">{selectedUserProfile.department || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Year</label>
                  <p className="text-lg">{selectedUserProfile.year || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joined</label>
                  <p className="text-lg">{new Date(selectedUserProfile.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg">
                    {selectedUserProfile.isOnline ? (
                      <Badge className="bg-green-600">Online</Badge>
                    ) : (
                      <Badge variant="outline">Offline</Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {selectedUserProfile.bio && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bio</label>
                  <p className="text-base mt-1">{selectedUserProfile.bio}</p>
                </div>
              )}

              {/* Interests */}
              {selectedUserProfile.interests && selectedUserProfile.interests.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Interests</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUserProfile.interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedUserProfile.matchCount}</div>
                  <div className="text-sm text-gray-500">Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedUserProfile.likesSent}</div>
                  <div className="text-sm text-gray-500">Likes Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{selectedUserProfile.likesReceived}</div>
                  <div className="text-sm text-gray-500">Likes Received</div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex gap-3">
                  <Button
                    onClick={() => openWarningModal(selectedUserProfile)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Warning
                  </Button>
                  <Button
                    onClick={() => openBanModal(selectedUserProfile)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                </div>
                <Button
                  onClick={() => openDeleteModal(selectedUserProfile)}
                  variant="destructive"
                  className="w-full bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-black"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account Permanently
                </Button>
                <Button
                  onClick={closeUserProfile}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && selectedUserProfile && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeWarningModal}
        >
          <Card 
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-6 w-6" />
                    Send Warning
                  </CardTitle>
                  <CardDescription>
                    Send a warning notification to {selectedUserProfile.name}
                  </CardDescription>
                </div>
                <button
                  onClick={closeWarningModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Warning Message</label>
                <Textarea
                  placeholder="e.g., Please avoid using inappropriate language in conversations. Maintain respectful communication with other users."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  rows={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This warning will appear as a notification when the user logs in.
                </p>
              </div>

              {/* Quick Warning Templates */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Templates</label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setWarningMessage('Please avoid using inappropriate language in conversations. Maintain respectful communication with other users.')}
                  >
                    Inappropriate Language
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setWarningMessage('We have received complaints about harassment. Please respect other users and their boundaries.')}
                  >
                    Harassment Warning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setWarningMessage('Your profile content violates our community guidelines. Please update your profile accordingly.')}
                  >
                    Profile Guidelines
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setWarningMessage('Please note that spamming or sending excessive messages is not allowed on this platform.')}
                  >
                    Spam Warning
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={sendWarning}
                  disabled={sendingWarning || !warningMessage.trim()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {sendingWarning ? 'Sending...' : 'Send Warning'}
                </Button>
                <Button
                  onClick={closeWarningModal}
                  variant="outline"
                  disabled={sendingWarning}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUserProfile && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeBanModal}
        >
          <Card 
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Ban className="h-6 w-6" />
                Ban User - {selectedUserProfile.name}
              </CardTitle>
              <CardDescription>
                ⚠️ <strong>Warning:</strong> Banning this user will immediately prevent them from accessing the platform. This is a serious action for users with fake identities or severe violations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUserProfile.photo_url} />
                    <AvatarFallback>{selectedUserProfile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedUserProfile.name}</p>
                    <p className="text-sm text-gray-600">{selectedUserProfile.email}</p>
                  </div>
                </div>
              </div>

              {/* Ban Reason Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ban Reason (Required)</label>
                <Textarea
                  placeholder="Enter the reason for banning this user (e.g., Fake identity, Policy violations, etc.)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={banningUser}
                />
                <p className="text-xs text-gray-500 mt-1">This reason will be stored in the database for records.</p>
              </div>

              {/* Quick Ban Reasons */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Reasons</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => setBanReason('Fake identity - User provided false information')}
                  >
                    Fake Identity
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => setBanReason('Harassment and inappropriate behavior towards other users')}
                  >
                    Harassment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => setBanReason('Spam and malicious activity detected')}
                  >
                    Spam/Malicious
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => setBanReason('Multiple violations of community guidelines')}
                  >
                    Policy Violations
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={banUser}
                  disabled={banningUser || !banReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                >
                  {banningUser ? 'Banning...' : 'Confirm Ban'}
                </Button>
                <Button
                  onClick={closeBanModal}
                  variant="outline"
                  disabled={banningUser}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUserProfile && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={closeDeleteModal}
        >
          <Card 
            className="w-full max-w-lg border-4 border-red-800"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="bg-red-950 text-white">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trash2 className="h-7 w-7" />
                ⚠️ DELETE USER PERMANENTLY
              </CardTitle>
              <CardDescription className="text-red-200">
                <strong>CRITICAL WARNING:</strong> This action will permanently delete this user and ALL their data from the database. This CANNOT be undone!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* User Info */}
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border-2 border-red-600">
                    <AvatarImage src={selectedUserProfile.photo_url} />
                    <AvatarFallback className="bg-red-200">{selectedUserProfile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{selectedUserProfile.name}</p>
                    <p className="text-sm text-gray-700">{selectedUserProfile.email}</p>
                    <p className="text-xs text-gray-600">{selectedUserProfile.department} • {selectedUserProfile.year} Year</p>
                  </div>
                </div>
              </div>

              {/* What will be deleted */}
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Data to be permanently deleted:
                </h4>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>User profile and account</li>
                  <li>All messages sent and received</li>
                  <li>All matches and connections</li>
                  <li>All likes (sent and received)</li>
                  <li>All warnings</li>
                  <li>Ban records (if any)</li>
                </ul>
              </div>

              {/* Admin Password Confirmation */}
              <div>
                <label className="text-sm font-bold mb-2 block text-red-900">
                  Enter Admin Password to Confirm (Required)
                </label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="border-2 border-red-400 focus:border-red-600"
                  disabled={deletingUser}
                  autoFocus
                />
                <p className="text-xs text-gray-600 mt-1">
                  You must enter your admin password to proceed with deletion.
                </p>
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ This action is IRREVERSIBLE. The user will be completely removed from the database and cannot be recovered.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={deleteUser}
                  disabled={deletingUser || !deletePassword.trim()}
                  className="flex-1 bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-black text-white font-bold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingUser ? 'Deleting...' : 'DELETE PERMANENTLY'}
                </Button>
                <Button
                  onClick={closeDeleteModal}
                  variant="outline"
                  disabled={deletingUser}
                  className="border-2"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
