# Achievements Feature - Implementation Guide

## ✅ Completed Steps:

### 1. Database Setup
Run this SQL in Supabase SQL Editor:
See `create-achievements-table.sql` file

### 2. API Endpoint Created
- `/api/achievements/route.js` - GET, POST, DELETE operations

### 3. Frontend User Interface
- Added Achievements tab in main navigation (🏅 Wins)
- Created achievements viewing page with grid layout
- Added achievement details modal
- Integrated with Trophy and Award icons

### 4. State Management
- Added achievements state in main app
- Added loading function `loadAchievements()`
- Integrated with initial data load

## ⏳ Remaining Steps:

### Admin Panel - Add Achievements Management

The admin panel needs a complete achievements management interface similar to events.  
You'll need to add in `app/admin/page.js`:

1. **Load Achievements Function** (add near line 180):
```javascript
const loadAchievements = async () => {
  try {
    const response = await fetch('/api/achievements')
    const data = await response.json()
    if (response.ok) {
      setAchievements(data.achievements || [])
    }
  } catch (error) {
    console.error('Failed to load achievements:', error)
  }
}
```

2. **Image Upload Handlers** (add after event image handlers around line 265):
```javascript
const handleAchievementImageSelect = async (file) => {
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file')
    return
  }

  if (file.size > 500 * 1024) {
    toast.error('Image size must be less than 500KB')
    return
  }

  const reader = new FileReader()
  reader.onloadend = () => {
    setAchievementImagePreview(reader.result)
    setAchievementForm({...achievementForm, image_url: reader.result})
  }
  reader.readAsDataURL(file)
}
```

3. **Save Achievement Function**:
```javascript
const handleSaveAchievement = async () => {
  setSavingAchievement(true)
  
  try {
    // Upload image if needed (similar to event image upload)
    let finalImageUrl = achievementForm.image_url
    
    if (achievementForm.image_url && !achievementForm.image_url.startsWith('http')) {
      // Upload to storage
      const uploadedUrl = await uploadAchievementImageToServer(achievementForm.image_url)
      if (!uploadedUrl) {
        toast.error('Failed to upload image')
        setSavingAchievement(false)
        return
      }
      finalImageUrl = uploadedUrl
    }

    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...achievementForm,
        image_url: finalImageUrl,
        created_by: 'Admin'
      })
    })

    if (response.ok) {
      toast.success('Achievement posted successfully!')
      setShowAchievementModal(false)
      resetAchievementForm()
      loadAchievements()
    } else {
      toast.error('Failed to post achievement')
    }
  } catch (error) {
    toast.error('Error posting achievement')
  }
  
  setSavingAchievement(false)
}
```

4. **Delete Achievement Function**:
```javascript
const handleDeleteAchievement = async (achievementId) => {
  if (!confirm('Are you sure you want to delete this achievement?')) return
  
  try {
    const response = await fetch(`/api/achievements?id=${achievementId}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      toast.success('Achievement deleted')
      loadAchievements()
    }
  } catch (error) {
    toast.error('Failed to delete achievement')
  }
}
```

5. **Add TabsContent for Achievements** (after Events TabsContent around line 2000):
```jsx
<TabsContent value="achievements">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Student Achievements</CardTitle>
        <CardDescription>Manage and showcase student achievements</CardDescription>
      </div>
      <Button
        onClick={() => {
          setShowAchievementModal(true)
          resetAchievementForm()
        }}
        className="bg-amber-600 hover:bg-amber-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Achievement
      </Button>
    </CardHeader>
    <CardContent>
      {/* Achievement Cards Grid - Similar to Events */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map(achievement => (
          <Card key={achievement.id}>
            {achievement.image_url && (
              <img src={achievement.image_url} className="w-full h-32 object-cover" />
            )}
            <CardHeader>
              <CardTitle className="text-lg">{achievement.achievement_title}</CardTitle>
              <p className="text-sm text-gray-600">{achievement.student_name}</p>
              <Badge>{achievement.sector}</Badge>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteAchievement(achievement.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

6. **Add Achievement Modal** (similar to Event Modal, add before closing div):
Create a modal form with fields:
- Student Name (text input)
- Achievement Title (text input)
- Description (textarea)
- Achievement Date (date picker)
- Sector (dropdown: CSE, AI, AIML, ECE, EEE, MECH, CIVIL, etc.)
- Achievement Type (dropdown: Competition, Research, Sports, Cultural, etc.)
- Position (text: 1st Place, 2nd Place, Winner, etc.)
- Organization (text input)
- Image Upload (drag & drop, max 500KB)

## Testing:

1. Run the SQL to create achievements table
2. Go to admin panel → Achievements tab
3. Add a test achievement
4. View it on the main page → 🏅 Wins tab
5. Test mobile and desktop views

## Notes:
- Image size limit: 500KB (same as events and profile photos)
- All students can view achievements
- Only admins can create/delete achievements
- Achievements are sorted by date (newest first)
