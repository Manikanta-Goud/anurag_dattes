# Admin Delete User - Complete Deletion Guide

## What Happens When You Delete a User from Admin Portal

When you delete a user account, the system now performs **complete permanent deletion**:

### ✅ What Gets Deleted:

1. **Supabase Database** - All user data:
   - Profile (name, bio, photo, etc.)
   - Messages (sent and received)
   - Matches (all connections)
   - Likes (given and received)
   - Friend requests
   - Warnings
   - Blocked users list

2. **Clerk Authentication** - User account deleted:
   - Cannot sign in again
   - Email verification removed
   - Session invalidated

3. **Permanent Ban Added**:
   - Email added to `banned_users` table with `is_permanent = true`
   - Prevents re-registration with same email

### 🚫 What They CANNOT Do After Deletion:

❌ **Cannot login** - Account deleted from Clerk
❌ **Cannot sign up again** - Email is permanently banned
❌ **Cannot access app** - All data removed
❌ **Cannot recover account** - Deletion is permanent

### ✅ How to Delete a User:

1. Go to Admin Portal
2. Find the user in the user list
3. Click "Delete User" button
4. Enter admin password: `admin123`
5. Confirm deletion

### 📋 SQL Migrations Required:

Run these in Supabase SQL Editor:

#### Migration 1: Add clerk_user_id column
```sql
-- File: add-clerk-user-id-column.sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
```

#### Migration 2: Add is_permanent column
```sql
-- File: add-permanent-ban-column.sql
ALTER TABLE banned_users ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_banned_users_permanent ON banned_users(email, is_permanent);
```

### 🔄 Re-Allowing a Deleted User:

If you want to allow a deleted user to sign up again:

1. Go to Supabase Dashboard
2. Navigate to Table Editor → `banned_users`
3. Find the user's email
4. Delete that row OR set `is_permanent = false`
5. User can now sign up again with a new Clerk account

### 🛡️ Security Features:

1. **Automatic Clerk Deletion**: Deletes authentication account
2. **Ban Check on Signup**: Prevents re-registration
3. **Immediate Clerk Cleanup**: If banned user somehow signs up, account is deleted immediately
4. **Admin-Only Control**: Only admin can unban users

### ⚠️ Important Notes:

- **Deletion is PERMANENT** - All data is removed
- **Cannot be undone** - No recovery option
- **Clerk account deleted** - User loses access completely
- **Email blocked** - Cannot use same email again (unless you unban)

### 🧪 Testing:

1. Create a test account
2. Delete it from admin portal
3. Try to sign in → Should fail (account doesn't exist)
4. Try to sign up with same email → Should be blocked
5. Check Clerk dashboard → User should be deleted

### 📊 What Gets Stored in Ban List:

```json
{
  "user_id": "uuid-here",
  "email": "user@anurag.edu.in",
  "name": "User Name",
  "reason": "Account permanently deleted by admin",
  "banned_at": "2025-12-05T10:30:00Z",
  "banned_by": "admin",
  "is_permanent": true
}
```

### 🎯 Complete Flow:

```
Admin clicks "Delete User"
    ↓
Enter admin password
    ↓
Get user's Clerk ID and email
    ↓
Delete all Supabase data (messages, matches, likes, etc.)
    ↓
Add email to permanent ban list
    ↓
Delete profile from Supabase
    ↓
Delete user from Clerk
    ↓
✅ User completely removed
    ↓
If user tries to sign up again
    ↓
Clerk creates account
    ↓
App checks ban list
    ↓
Email is banned → Delete Clerk account immediately
    ↓
🚫 User blocked from using app
```

### 💡 Use Cases:

**When to use permanent deletion:**
- User violated terms severely
- Harassment or abuse
- Fake account
- Spam account
- User requested account deletion

**When NOT to delete:**
- Temporary suspension (use ban feature instead)
- First-time minor violation (use warning system)
- Investigation pending (use ban temporarily)

---

## Summary

✅ Complete deletion from both Supabase and Clerk
✅ Permanent ban prevents re-registration
✅ Admin has full control over who can access the app
✅ Easy to unban if needed (just remove from banned_users table)
