# 🔗 Social Links Feature - Testing Guide

## Overview
Added GitHub and LinkedIn profile links to make the platform more professional for networking.

## ⚠️ IMPORTANT: Database Setup Required

**Before testing, you MUST run this SQL in Supabase Dashboard → SQL Editor:**

```sql
-- Add GitHub and LinkedIn columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS github TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin TEXT;
```

Or simply run the file: `add-social-links.sql`

---

## ✅ Features Implemented

### 1. **Profile Form Fields**
- Added GitHub input field (accepts URL or username)
- Added LinkedIn input field (accepts URL or username)
- Both fields are optional

### 2. **Profile Setup (New Users)**
- GitHub and LinkedIn fields available during initial profile setup
- Data is sent to API and saved to database

### 3. **Profile Edit (Existing Users)**
- Can edit GitHub and LinkedIn from "My Profile" → "Edit Profile"
- Changes are saved and reflected immediately

### 4. **Profile Display - My Profile View**
- Shows clickable GitHub button (dark theme)
- Shows clickable LinkedIn button (blue theme)
- Only displays if user has added the links

### 5. **Profile Display - Discover Tab**
- When viewing another user's profile modal
- Shows social links in "Connect" section
- All links open in new tab

### 6. **Profile Display - Mobile View**
- Fully responsive social link buttons
- Smaller text and icons for mobile screens

---

## 🧪 Testing Checklist

### Test 1: Database Setup
- [ ] Run SQL migration in Supabase
- [ ] Verify columns exist with: `SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name IN ('github','linkedin');`

### Test 2: Profile Setup (New User)
- [ ] Sign up with new account
- [ ] Fill GitHub field (e.g., `https://github.com/yourusername`)
- [ ] Fill LinkedIn field (e.g., `https://linkedin.com/in/yourprofile`)
- [ ] Complete profile setup
- [ ] Check if data is saved in database

### Test 3: Profile Edit (Existing User)
- [ ] Go to "My Profile" tab
- [ ] Click "Edit Profile"
- [ ] Add/update GitHub link
- [ ] Add/update LinkedIn link
- [ ] Click "Save Changes"
- [ ] Verify links appear in "My Profile" view
- [ ] Click each link to ensure they open correctly

### Test 4: Profile View in Discover
- [ ] Go to "Discover" tab
- [ ] Click on a user's profile card
- [ ] Verify GitHub/LinkedIn links are visible in the modal
- [ ] Click each social link to verify they open in new tab
- [ ] Test with both full URLs and usernames

### Test 5: URL Formats
Test these different input formats:
- [ ] Full GitHub URL: `https://github.com/username`
- [ ] GitHub username only: `username`
- [ ] Full LinkedIn URL: `https://linkedin.com/in/username`
- [ ] LinkedIn profile: `username`
- [ ] Instagram with @: `@username`
- [ ] Instagram without @: `username`

### Test 6: Mobile Responsiveness
- [ ] Open on mobile device (or use Chrome DevTools mobile view)
- [ ] Verify social links display correctly
- [ ] Verify buttons are touchable and sized appropriately
- [ ] Test clicking links on mobile

### Test 7: Data Persistence
- [ ] Add GitHub and LinkedIn links
- [ ] Log out
- [ ] Log back in
- [ ] Verify links are still there
- [ ] Edit and save again
- [ ] Verify changes persist

### Test 8: Empty State
- [ ] Create profile without social links
- [ ] Verify "Professional Links" section doesn't show when empty
- [ ] Add one link (GitHub only)
- [ ] Verify section shows with only GitHub button
- [ ] Add LinkedIn
- [ ] Verify both buttons show

---

## 🎨 UI/UX Features

### Button Styling
- **GitHub**: Dark gray/black with GitHub icon (SVG)
- **LinkedIn**: Blue with LinkedIn icon (SVG)
- **Instagram**: Purple-to-pink gradient with Instagram icon (SVG)

### Responsive Design
- Desktop: Full-sized buttons with 5px icons
- Mobile: Smaller buttons with 4px icons and compact spacing

### Smart URL Handling
- Automatically prepends `https://github.com/` if only username is provided
- Automatically prepends `https://linkedin.com/in/` if only username is provided
- Supports both full URLs and usernames

---

## 🐛 Known Issues / Edge Cases

1. **Empty Links**: If user enters spaces only, it should be treated as empty
2. **Invalid URLs**: No validation yet for malformed URLs
3. **Special Characters**: Username with special characters might break

---

## 📝 Files Modified

1. **app/page.js**
   - Added `github` and `linkedin` to profile form state
   - Added input fields in profile setup UI
   - Added input fields in profile edit UI
   - Added social links display in "My Profile" view
   - Added social links display in profile modals (desktop + mobile)
   - Updated all profile update/save functions

2. **app/api/[[...path]]/route.js**
   - Updated `handleUpdateProfile` to accept `github` and `linkedin`
   - Updated `handleGetProfiles` to include `github` and `linkedin` in SELECT query

3. **add-social-links.sql**
   - SQL migration to add columns to database

---

## 🚀 Deployment Notes

### Before Deploying to Production:
1. Run SQL migration in production Supabase instance
2. Test all features in production environment
3. Verify database columns exist
4. Test with real users

### Environment Variables:
No new environment variables needed - uses existing Supabase connection

---

## 💡 Future Enhancements

1. Add URL validation
2. Add Twitter/X profile link
3. Add portfolio website link
4. Show link preview on hover
5. Add verification badges for active links
6. Analytics: track how many users click social links

---

## ❓ Troubleshooting

### Links not appearing after adding them:
- Check if SQL migration was run
- Check browser console for errors
- Verify data is in database: `SELECT id, name, github, linkedin FROM profiles WHERE github IS NOT NULL OR linkedin IS NOT NULL;`

### Buttons not clickable:
- Check if `target="_blank"` is present in anchor tags
- Verify `rel="noopener noreferrer"` for security

### Data not saving:
- Check API response in Network tab
- Verify Supabase permissions allow UPDATE on profiles table
- Check if github/linkedin columns exist in database

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Network tab for failed API requests
3. Verify SQL migration was successful
4. Check Supabase logs for database errors

---

**Last Updated**: December 7, 2025
**Status**: ✅ Ready for Testing (after SQL migration)
