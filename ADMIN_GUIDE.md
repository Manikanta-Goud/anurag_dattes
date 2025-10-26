# Admin Quick Start Guide

## Login to Admin Panel
- URL: http://localhost:3000/admin
- Username: `admin`
- Password: `admin123`

## Sending Warnings to Users

### Method 1: From Conversations Tab
1. Click on **"Conversations"** tab in admin panel
2. Find the user in the conversation list
3. Click on their **avatar/profile picture**
4. A modal will pop up showing:
   - User's photo and name
   - Email address
   - Department and year
   - Join date and online status
   - Bio and interests
   - Statistics (matches, likes sent/received)

5. Click **"Send Warning"** button
6. Another modal appears with:
   - Textarea for custom message
   - 4 quick templates:
     - Inappropriate language warning
     - Harassment warning
     - Profile guidelines warning
     - Spam warning

7. Either:
   - Click a template to use pre-written message
   - Or type your own custom message

8. Click **"Send Warning"** button
9. Success toast notification appears
10. User will see warning on their next login

## What Happens When User Receives Warning?

1. User logs into the app
2. Red toast notification appears with your warning message
3. Notification stays for 10 seconds
4. User can click "Dismiss" to close immediately
5. Warning is automatically marked as read
6. Same warning won't show again

## Admin Dashboard Features

### Stats Cards
- **Total Users**: All registered users
- **Total Matches**: Successful connections
- **Total Messages**: All messages sent
- **Total Likes**: All likes given
- **New Users (7 Days)**: Recent signups
- **Online Users**: Currently active users

### All Users Tab
- View complete user list
- Search by name
- See online status (green dot)
- View match count
- Click to see full profile

### New Users Tab
- Users who joined in last 7 days
- Same features as All Users tab
- Helps track growth

### Conversations Tab
- All active matches/conversations
- See both users in conversation
- View message count
- Last message preview
- Click message count to expand full chat history
- **Click avatar to view profile and send warning**

## Tips for Effective Warnings

1. **Be Specific**: Tell users exactly what they did wrong
2. **Be Professional**: Keep warnings respectful and clear
3. **Use Templates**: For common issues, templates save time
4. **Custom Messages**: For unique situations, write specific warnings
5. **Document**: Keep your own notes of warnings sent (feature can be added)

## Warning Templates Explained

### 1. Inappropriate Language
"Please avoid using inappropriate language in your messages. This violates our community guidelines."
- Use for: Profanity, offensive language, explicit content

### 2. Harassment
"We have received complaints about harassment. Please be respectful to other users."
- Use for: Bullying, threatening, persistent unwanted contact

### 3. Profile Guidelines
"Your profile content violates our community guidelines. Please update it."
- Use for: Inappropriate photos, fake information, offensive bio

### 4. Spam
"Please note that spamming or sending excessive messages is not allowed."
- Use for: Copy-paste messages, excessive messaging, promotional content

## Current Limitations & Future Features

### Current:
- Warnings are one-time notifications
- No warning history stored visibly
- No automatic ban system
- No warning severity levels

### Planned (Optional):
- Warning history for each user
- Three-strike ban system
- Warning analytics
- Email notifications
- Appeal system

## Troubleshooting

### Warning not showing to user?
1. Check that warnings table exists in Supabase
2. Verify API endpoint returned success
3. Ask user to logout and login again

### Can't click on avatar?
1. Make sure you're on Conversations tab
2. Ensure there are active conversations
3. Try refreshing admin panel

### Modal not opening?
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try different browser

## Admin Security

⚠️ **IMPORTANT**: 
- Current password: `admin123`
- Hardcoded in backend
- For production: Change password in `app/api/[[...path]]/route.js`
- Look for `ADMIN_CREDENTIALS` object
- Use strong password
- Consider adding password change feature

## Database Access

If you need to manually check warnings:
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select "warnings" table
4. View all warnings sent
5. Can manually edit or delete

## Contact & Support

For issues or questions:
- Check `WARNING_SYSTEM_README.md` for technical details
- Review browser console for error messages
- Verify database connection in Supabase
