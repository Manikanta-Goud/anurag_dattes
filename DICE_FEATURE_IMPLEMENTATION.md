# 🎲 FOMO Dice Feature - Complete Implementation Guide

## ✅ Backend - COMPLETE
All API endpoints created in `app/api/[[...path]]/route.js`:

### Endpoints:
1. **POST /api/dice/roll** - Roll dice once per day
2. **GET /api/dice/matches** - Get users who rolled same number  
3. **POST /api/dice/select** - Select a match (instant friend)
4. **POST /api/dice/mark-chatted** - Mark as chatted (prevent auto-unmatch)
5. **GET /api/dice/active-matches** - Get active dice matches with expiry

### Database:
- `dice_rolls` table - Stores daily rolls
- `dice_matches` table - Stores auto-matched pairs (24h expiry)
- Auto-cleanup function for expired matches

## 🎨 Frontend Components to Add

### 1. Add Dice Functions (after line 2000 in page.js)

```javascript
// 🎲 FOMO DICE FUNCTIONS

const rollDice = async () => {
  if (!currentUser) return
  
  setIsRolling(true)
  setShowDiceAnimation(true)
  
  try {
    const response = await fetch('/api/dice/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    })
    
    const data = await response.json()
    
    if (data.alreadyRolled) {
      toast.error(data.message)
      setDiceRolled(true)
      setMyDiceNumber(data.roll.dice_number)
      setHasSelectedMatch(data.roll.has_selected_match)
      loadDiceMatches()
    } else if (data.success) {
      // Animate dice roll
      setTimeout(() => {
        setMyDiceNumber(data.diceNumber)
        setDiceRolled(true)
        setShowDiceAnimation(false)
        toast.success(data.message)
        loadDiceMatches()
      }, 2000)
    }
  } catch (error) {
    console.error('Roll dice error:', error)
    toast.error('Failed to roll dice')
  } finally {
    setIsRolling(false)
  }
}

const loadDiceMatches = async () => {
  if (!currentUser) return
  
  try {
    const response = await fetch(`/api/dice/matches?userId=${currentUser.id}`)
    const data = await response.json()
    
    if (data.hasRolled) {
      setDiceRolled(true)
      setMyDiceNumber(data.myDiceNumber)
      setDiceMatches(data.matches || [])
      setHasSelectedMatch(data.hasSelectedMatch)
    }
  } catch (error) {
    console.error('Load dice matches error:', error)
  }
}

const selectDiceMatch = async (selectedUser) => {
  setSelectedDiceProfile(selectedUser)
  setShowConfirmModal(true)
}

const confirmDiceMatch = async () => {
  if (!selectedDiceProfile || !currentUser) return
  
  try {
    const response = await fetch('/api/dice/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        selectedUserId: selectedDiceProfile.id
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('🎉 Instant Match! You have 24 hours to chat!')
      setHasSelectedMatch(true)
      setShowConfirmModal(false)
      loadMatches(currentUser.id) // Reload matches list
      loadActiveDiceMatches()
    } else {
      toast.error(data.error)
    }
  } catch (error) {
    console.error('Select dice match error:', error)
    toast.error('Failed to create match')
  }
}

const loadActiveDiceMatches = async () => {
  if (!currentUser) return
  
  try {
    const response = await fetch(`/api/dice/active-matches?userId=${currentUser.id}`)
    const data = await response.json()
    setActiveDiceMatches(data.diceMatches || [])
  } catch (error) {
    console.error('Load active dice matches error:', error)
  }
}

const markDiceMatchChatted = async (matchedUserId) => {
  if (!currentUser) return
  
  try {
    await fetch('/api/dice/mark-chatted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        matchedUserId
      })
    })
  } catch (error) {
    console.error('Mark dice match chatted error:', error)
  }
}

// Load dice matches when mainNav changes to dice
useEffect(() => {
  if (mainNav === 'dice' && currentUser) {
    loadDiceMatches()
    loadActiveDiceMatches()
  }
}, [mainNav, currentUser])

// Auto-refresh dice matches every 30 seconds
useEffect(() => {
  if (mainNav === 'dice' && diceRolled) {
    const interval = setInterval(loadDiceMatches, 30000)
    return () => clearInterval(interval)
  }
}, [mainNav, diceRolled])
```

### 2. Add Dice UI Section (after Events section, around line 5700)

```javascript
{/* 🎲 FOMO DICE SECTION */}
{mainNav === 'dice' && (
  <div className="space-y-8 animate-fade-in pb-20">
    {/* Dice Header */}
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-8 shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Dices className="h-10 w-10 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">🎲 FOMO Dice</h2>
              <p className="text-orange-100 font-medium text-lg">Roll, Match, Chat or Lose!</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
          <h3 className="text-white font-bold text-xl mb-3">⚡ How It Works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">🎲</div>
              <div className="text-white font-bold mb-1">1. Roll Once</div>
              <div className="text-orange-100 text-sm">Get a number 1-6 (once per day)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-white font-bold mb-1">2. See Matches</div>
              <div className="text-orange-100 text-sm">View others with same number</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-bold mb-1">3. Instant Friend</div>
              <div className="text-orange-100 text-sm">Select ONE - no request needed!</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-white font-bold mb-1">4. Chat in 24h</div>
              <div className="text-orange-100 text-sm">Or auto-unmatch!</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Dice Roll Section */}
    {!diceRolled ? (
      <div className="max-w-2xl mx-auto">
        <Card className="border-4 border-orange-200 shadow-2xl">
          <CardContent className="p-12 text-center">
            {showDiceAnimation ? (
              <div className="space-y-6">
                <div className="text-8xl animate-spin">🎲</div>
                <p className="text-2xl font-bold text-gray-700">Rolling...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-8xl">🎲</div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Ready to Roll?
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Roll the dice once today and discover your random matches! Select one person to become instant friends.
                </p>
                <Button
                  onClick={rollDice}
                  disabled={isRolling}
                  className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 transform hover:scale-105 transition-all shadow-xl"
                >
                  <Dices className="h-6 w-6 mr-2" />
                  Roll the Dice! 🎲
                </Button>
                <p className="text-sm text-gray-500">One roll per day • Choose wisely!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    ) : hasSelectedMatch ? (
      <div className="max-w-2xl mx-auto">
        <Card className="border-4 border-green-200 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="space-y-6">
              <div className="text-8xl">✅</div>
              <h3 className="text-3xl font-black text-green-600">Match Selected!</h3>
              <p className="text-gray-600 text-lg">
                You've already selected your match for today. Check your Friends tab and start chatting within 24 hours!
              </p>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm font-bold text-yellow-800">⏰ Remember: Chat within 24 hours or you'll be auto-unmatched!</p>
              </div>
              <Button
                onClick={() => setMainNav('home')}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Go to Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    ) : (
      <div className="space-y-6">
        {/* Your Number */}
        <Card className="border-4 border-orange-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-6 shadow-lg">
                  <div className="text-6xl font-black text-white">{myDiceNumber}</div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">You Rolled: {myDiceNumber}</h3>
                  <p className="text-gray-600">{diceMatches.length} {diceMatches.length === 1 ? 'person' : 'people'} rolled the same number</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-600">🎲 Daily Roll Used</p>
                <p className="text-xs text-gray-500">Come back tomorrow!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches Grid */}
        {diceMatches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-xl font-bold text-gray-700 mb-2">No matches yet</p>
              <p className="text-gray-500">No one else rolled {myDiceNumber} today. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diceMatches.map((profile) => (
              <Card key={profile.id} className="border-2 border-purple-200 hover:border-orange-400 hover:shadow-2xl transition-all transform hover:scale-105">
                <CardContent className="p-6">
                  {/* Profile Picture */}
                  <div className="relative mb-4">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                      {profile.photo_url ? (
                        <img 
                          src={profile.photo_url} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-24 w-24 text-purple-300" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full p-3 shadow-lg">
                      <div className="text-2xl font-black text-white">{myDiceNumber}</div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{profile.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{profile.department} • Year {profile.year}</p>
                  
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{profile.bio}</p>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {profile.interests.slice(0, 3).map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Select Button */}
                  <Button
                    onClick={() => selectDiceMatch(profile)}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 font-bold shadow-lg transform hover:scale-105 transition-all"
                  >
                    ⚡ Select & Instant Match
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)}

{/* Confirmation Modal */}
{showConfirmModal && selectedDiceProfile && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <Card className="max-w-md w-full border-4 border-orange-300 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
        <CardTitle className="text-2xl font-black flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Confirm Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
            {selectedDiceProfile.photo_url ? (
              <img src={selectedDiceProfile.photo_url} alt={selectedDiceProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-12 w-12 text-purple-300" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedDiceProfile.name}</h3>
          <p className="text-gray-600 mb-4">{selectedDiceProfile.department} • Year {selectedDiceProfile.year}</p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-2">
          <p className="font-bold text-yellow-800 text-center">⚠️ Important Rules:</p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✅ You become friends INSTANTLY (no request)</li>
            <li>✅ You can select only ONE person per day</li>
            <li>⏰ You MUST chat within 24 hours</li>
            <li>❌ If you don't chat, you'll be AUTO-UNMATCHED</li>
          </ul>
        </div>

        <p className="text-center font-bold text-gray-700">Are you sure you want to select this person?</p>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setShowConfirmModal(false)
              setSelectedDiceProfile(null)
            }}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDiceMatch}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 font-bold"
          >
            Yes, Select!
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

## 🔥 Auto-Unmatch Logic

Add this to the message send handler (handleSendMessage function):

```javascript
// Inside handleSendMessage, after sending message successfully:

// Check if this is a dice match and mark as chatted
const diceMatch = activeDiceMatches.find(dm => 
  (dm.user1_id === currentUser.id && dm.user2_id === selectedMatch.id) ||
  (dm.user2_id === currentUser.id && dm.user1_id === selectedMatch.id)
)

if (diceMatch && !diceMatch.has_chatted) {
  await markDiceMatchChatted(selectedMatch.id)
  toast.success('✅ You saved this friendship by chatting in time!')
}
```

## 📋 Setup Checklist

1. ✅ Run `setup-dice-feature.sql` in Supabase SQL Editor
2. ✅ Backend API endpoints already added to route.js
3. ⬜ Add dice state variables to page.js (line ~90)
4. ⬜ Add dice functions to page.js (after line ~2000)
5. ⬜ Add Dice button to navigation (line ~3415)
6. ⬜ Add Dice UI section to page.js (after Events section ~5700)
7. ⬜ Add auto-unmatch logic to message handler
8. ⬜ Test the complete flow!

## 🎨 CSS Animations (already in globals.css)

The existing animations will work perfectly:
- `animate-bounce` - Dice icon
- `animate-pulse` - Notification dot
- `animate-spin` - Rolling animation
- `animate-fade-in` - Section transitions

## 🚀 Ready to Deploy!

Once all steps are complete, your FOMO Dice feature will be fully functional with:
- Beautiful UI with gradients and animations
- One roll per day restriction
- Instant matching (no friend requests)
- 24-hour chat deadline
- Auto-unmatch if no chat
- Double confirmation before selecting
