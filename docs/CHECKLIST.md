# 📋 SECURITY FIX CHECKLIST

**Project:** Anurag Dattes  
**Date Started:** _______________  
**Date Completed:** _______________

---

## 🔴 PHASE 1: IMMEDIATE CRITICAL FIXES (DO NOW!)

### 1.1 Rotate Credentials
- [ ] Go to Supabase Dashboard (https://supabase.com/dashboard)
- [ ] Navigate to Settings → API
- [ ] Click "Reset" on ANON KEY
- [ ] Click "Reset" on SERVICE_ROLE_KEY
- [ ] Save new keys in a secure location (password manager)
- [ ] Go to Clerk Dashboard
- [ ] Navigate to API Keys
- [ ] Rotate Clerk keys if exposed
- [ ] Save new Clerk keys

**Time:** 15 minutes  
**Priority:** 🔴 CRITICAL

---

### 1.2 Setup Environment Variables
- [ ] Copy `.env.example` to `.env.local`
  ```powershell
  Copy-Item .env.example .env.local
  ```
- [ ] Open `.env.local` in editor
- [ ] Fill in NEXT_PUBLIC_SUPABASE_URL with new URL
- [ ] Fill in NEXT_PUBLIC_SUPABASE_ANON_KEY with new key
- [ ] Fill in SUPABASE_SERVICE_ROLE_KEY with new key
- [ ] Fill in Clerk keys
- [ ] Save `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`
  ```powershell
  Select-String -Path .gitignore -Pattern "\.env\.local"
  ```
- [ ] Delete old `.env` file if it contains credentials

**Time:** 10 minutes  
**Priority:** 🔴 CRITICAL

---

### 1.3 Install Security Packages
- [ ] Open terminal in project directory
- [ ] Run: `npm install bcrypt zod`
- [ ] Wait for installation to complete
- [ ] Verify installation: `npm list bcrypt zod`

**Time:** 5 minutes  
**Priority:** 🔴 CRITICAL

---

## 🟡 PHASE 2: PROJECT REORGANIZATION (TODAY)

### 2.1 Run Reorganization Script
- [ ] Review `reorganize-project.ps1` (optional)
- [ ] Run script:
  ```powershell
  .\reorganize-project.ps1
  ```
- [ ] Verify new directories created:
  - [ ] `frontend/` exists
  - [ ] `backend/` exists
  - [ ] `config/` exists
  - [ ] `docs/` exists
- [ ] Check that files were copied (originals remain)

**Time:** 5 minutes  
**Priority:** 🟡 HIGH

---

### 2.2 Apply Secured Files
- [ ] Replace `lib/supabase.js` with secured version:
  ```powershell
  Copy-Item backend\lib\supabase.js lib\supabase.js -Force
  ```
- [ ] Replace `middleware.js` with secured version:
  ```powershell
  Copy-Item middleware-secured.js middleware.js -Force
  ```
- [ ] Replace `next.config.js` with secured version:
  ```powershell
  Copy-Item next.config-secured.js next.config.js -Force
  ```
- [ ] Verify replacements:
  - [ ] No hardcoded credentials in `lib/supabase.js`
  - [ ] Admin routes protected in `middleware.js`
  - [ ] Security headers in `next.config.js`

**Time:** 5 minutes  
**Priority:** 🟡 HIGH

---

## 🟢 PHASE 3: CODE UPDATES (TODAY)

### 3.1 Update Main API Route
- [ ] Open `app/api/[[...path]]/route.js`
- [ ] Add imports at top:
  ```javascript
  import { hashPassword, verifyPassword } from '../../../backend/lib/auth'
  import { signupSchema, loginSchema } from '../../../backend/lib/validation'
  ```
- [ ] Remove old hashPassword function (lines ~20-26)
- [ ] Remove old verifyPassword function
- [ ] Update handleSignup to use new validation:
  - [ ] Add schema validation
  - [ ] Use new hashPassword function
- [ ] Update handleLogin to use new validation:
  - [ ] Add schema validation
  - [ ] Use new verifyPassword function
- [ ] Save file
- [ ] Check for syntax errors

**Time:** 30 minutes  
**Priority:** 🟡 HIGH

---

### 3.2 Add Validation to Other API Routes
- [ ] Open `app/api/achievements/route.js`
- [ ] Add validation import:
  ```javascript
  import { achievementSchema } from '../../../backend/lib/validation'
  ```
- [ ] Add validation to POST handler
- [ ] Save file

**Time:** 10 minutes  
**Priority:** 🟢 MEDIUM

---

## ✅ PHASE 4: TESTING (TODAY)

### 4.1 Test Development Server
- [ ] Start dev server: `npm run dev`
- [ ] Server starts without errors
- [ ] No "Missing environment variable" errors
- [ ] Check console for warnings

**Time:** 5 minutes  
**Priority:** ✅ REQUIRED

---

### 4.2 Test Authentication
- [ ] Navigate to: http://localhost:3001
- [ ] Try to access: http://localhost:3001/admin
  - [ ] Should redirect to sign-in page
- [ ] Go to sign-up page
- [ ] Try invalid email format
  - [ ] Should show validation error
- [ ] Try weak password (no special chars)
  - [ ] Should show validation error
- [ ] Sign up with valid college ID and strong password
  - [ ] Should create account successfully
- [ ] Sign out
- [ ] Sign in with same credentials
  - [ ] Should log in successfully

**Time:** 10 minutes  
**Priority:** ✅ REQUIRED

---

### 4.3 Test API Protection
- [ ] Open PowerShell/Terminal
- [ ] Test unauthenticated API call:
  ```powershell
  curl http://localhost:3001/api/achievements -v
  ```
  - [ ] Should return 401 Unauthorized
- [ ] Sign in to application
- [ ] Check browser Network tab
- [ ] Find Authorization header in requests
- [ ] API calls should work when authenticated

**Time:** 5 minutes  
**Priority:** ✅ REQUIRED

---

### 4.4 Test Admin Protection
- [ ] Sign in with regular (non-admin) user
- [ ] Try to access: http://localhost:3001/admin
  - [ ] Should redirect to home page
- [ ] Make your user admin in database:
  ```sql
  UPDATE users SET is_admin = true WHERE email = 'your@email.com';
  ```
- [ ] Refresh page
- [ ] Try to access admin page again
  - [ ] Should now have access

**Time:** 10 minutes  
**Priority:** ✅ REQUIRED

---

## 🔍 PHASE 5: VERIFICATION (TODAY)

### 5.1 Security Verification
- [ ] Search for hardcoded credentials:
  ```powershell
  Select-String -Path . -Pattern "eyJhbGci" -Recurse -Exclude "*.md","node_modules"
  ```
  - [ ] Should return 0 results (or only in .md docs)
- [ ] Verify .env.local exists:
  ```powershell
  Test-Path .env.local
  ```
  - [ ] Should return True
- [ ] Verify .env.local in .gitignore:
  ```powershell
  Select-String -Path .gitignore -Pattern "\.env\.local"
  ```
  - [ ] Should find the pattern
- [ ] Check git status:
  ```powershell
  git status
  ```
  - [ ] .env.local should NOT appear in changes

**Time:** 5 minutes  
**Priority:** ✅ REQUIRED

---

### 5.2 Code Quality Checks
- [ ] Run linter: `npm run lint`
  - [ ] Fix any errors found
- [ ] Run security audit: `npm audit`
  - [ ] Review vulnerabilities
  - [ ] Run `npm audit fix` if safe
- [ ] Check dependencies are up to date

**Time:** 10 minutes  
**Priority:** 🟢 MEDIUM

---

## 🚀 PHASE 6: GIT & DEPLOYMENT (AFTER TESTING)

### 6.1 Git Cleanup
- [ ] Review changes:
  ```powershell
  git status
  git diff
  ```
- [ ] Stage secured files:
  ```powershell
  git add backend/ config/ docs/
  git add middleware.js next.config.js
  git add .env.example .gitignore
  git add package.json
  ```
- [ ] Commit changes:
  ```powershell
  git commit -m "Security: Fix critical vulnerabilities and reorganize project"
  ```
- [ ] Do NOT commit .env.local
- [ ] Push to remote (if safe)

**Time:** 10 minutes  
**Priority:** 🟢 MEDIUM

---

### 6.2 Remove Old Credentials from Git History (If Exposed)
⚠️ **Only if credentials were committed to Git**

- [ ] Backup repository:
  ```powershell
  Copy-Item -Recurse .git .git-backup
  ```
- [ ] Install git-filter-repo:
  ```powershell
  pip install git-filter-repo
  ```
- [ ] Remove sensitive file from history:
  ```powershell
  git filter-repo --invert-paths --path lib/supabase.js --force
  ```
- [ ] Force push (⚠️ rewrites history):
  ```powershell
  git push origin --force --all
  ```
- [ ] Notify team members to re-clone

**Time:** 20 minutes  
**Priority:** 🔴 CRITICAL (if applicable)

---

### 6.3 Production Deployment
- [ ] Verify all tests pass
- [ ] Update production environment variables
- [ ] Set production environment to use new keys
- [ ] Deploy to production
- [ ] Test production deployment
- [ ] Monitor logs for errors
- [ ] Verify HTTPS is working
- [ ] Test authentication in production
- [ ] Test admin access in production

**Time:** 30 minutes  
**Priority:** 🟡 HIGH

---

## 📚 PHASE 7: DOCUMENTATION & MAINTENANCE

### 7.1 Team Communication
- [ ] Notify team about changes
- [ ] Share MIGRATION_GUIDE.md with team
- [ ] Document new environment variables needed
- [ ] Update README.md with security info
- [ ] Schedule security training (if team)

**Time:** 15 minutes  
**Priority:** 🟢 MEDIUM

---

### 7.2 Setup Monitoring
- [ ] Install error tracking (Sentry, optional)
- [ ] Setup log monitoring
- [ ] Configure alerts for security events
- [ ] Setup uptime monitoring
- [ ] Configure backup schedule

**Time:** 30 minutes  
**Priority:** 🟢 MEDIUM

---

## 📊 COMPLETION SUMMARY

### Time Breakdown
- Phase 1 (Critical): 30 minutes
- Phase 2 (Reorganization): 10 minutes
- Phase 3 (Code Updates): 40 minutes
- Phase 4 (Testing): 30 minutes
- Phase 5 (Verification): 15 minutes
- Phase 6 (Git/Deploy): 60 minutes
- Phase 7 (Documentation): 45 minutes

**Total Time:** ~3.5 hours

### Sign-Off

- [ ] All critical vulnerabilities fixed
- [ ] All tests passing
- [ ] Code deployed to production
- [ ] Team notified
- [ ] Documentation updated

**Completed By:** _______________  
**Date:** _______________  
**Signature:** _______________

---

## 🎯 QUICK STATUS

Fill this out as you progress:

```
[ ] Phase 1: Critical Fixes        ___% complete
[ ] Phase 2: Reorganization        ___% complete
[ ] Phase 3: Code Updates          ___% complete
[ ] Phase 4: Testing               ___% complete
[ ] Phase 5: Verification          ___% complete
[ ] Phase 6: Git & Deployment      ___% complete
[ ] Phase 7: Documentation         ___% complete

Overall Progress: ___% complete
```

---

## 📞 SUPPORT REFERENCES

- **Security Details:** `SECURITY_AUDIT_AND_FIXES.md`
- **Step-by-Step Guide:** `MIGRATION_GUIDE.md`
- **Quick Reference:** `QUICK_REFERENCE.md`
- **Complete Summary:** `README_SECURITY_SUMMARY.md`
- **File Structure:** `REORGANIZATION_PLAN.md`

---

**Good luck! 🚀 You've got this!**
