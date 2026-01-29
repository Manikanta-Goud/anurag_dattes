# 🚀 PROJECT MIGRATION AND SECURITY FIX GUIDE

## 🔴 CRITICAL: Read This First!

Your application has **CRITICAL SECURITY VULNERABILITIES** that need immediate attention. This guide will help you:

1. Secure your application
2. Reorganize code for better maintainability
3. Implement security best practices

---

## ⚠️ IMMEDIATE ACTIONS (DO THESE NOW!)

### Step 1: Rotate All Credentials (URGENT!)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Go to Settings → API
   - Click "Reset" on both ANON KEY and SERVICE_ROLE_KEY
   - Save the new keys securely

2. **Go to Clerk Dashboard**
   - Navigate to your Clerk dashboard
   - Go to API Keys
   - Rotate your keys if they've been exposed

### Step 2: Setup Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Edit `.env.local` and fill in your NEW credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
   
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

3. **VERIFY** `.env.local` is in `.gitignore`:
   ```powershell
   Select-String -Path .gitignore -Pattern "\.env\.local"
   ```

### Step 3: Install Required Security Packages

```powershell
npm install bcrypt zod
```

---

## 📁 PROJECT REORGANIZATION

### Run Reorganization Script

```powershell
# Run the reorganization script
.\reorganize-project.ps1
```

This script will:
- Create `frontend/` and `backend/` directories
- Copy files to their appropriate locations
- Organize database migrations
- Separate utility scripts

### New Directory Structure

```
anurag_dattes/
│
├── frontend/              # Client-side code
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   └── hooks/            # Custom hooks
│
├── backend/              # Server-side code
│   ├── api/             # API routes
│   ├── lib/             # Backend utilities
│   ├── database/        # SQL migrations
│   └── scripts/         # Utility scripts
│
├── config/              # Configuration
│   └── security.js      # Security settings
│
└── docs/               # Documentation
```

---

## 🔧 APPLY SECURITY FIXES

### Fix 1: Secure Supabase Client

**Replace** `lib/supabase.js` with the secured version:

```powershell
Copy-Item backend\lib\supabase.js lib\supabase.js -Force
```

### Fix 2: Secure Middleware

**Replace** `middleware.js` with the secured version:

```powershell
Copy-Item middleware-secured.js middleware.js -Force
```

### Fix 3: Secure Next.js Configuration

**Replace** `next.config.js` with the secured version:

```powershell
Copy-Item next.config-secured.js next.config.js -Force
```

### Fix 4: Update API Route to Use Bcrypt

Edit `app/api/[[...path]]/route.js`:

1. **Add import** at the top:
```javascript
import { hashPassword, verifyPassword, validateCollegeId } from '../../../backend/lib/auth'
import { signupSchema, loginSchema } from '../../../backend/lib/validation'
```

2. **Remove the weak hashing functions** (lines 20-26):
```javascript
// DELETE THESE LINES:
function hashPassword(password) {
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash
}
```

3. **Update signup function** to use new validation:
```javascript
async function handleSignup(request) {
  const body = await request.json()
  
  // Validate input
  const validation = signupSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    )
  }
  
  const { email, password, name } = validation.data
  
  // Hash password securely
  const hashedPassword = await hashPassword(password)
  
  // Continue with rest of signup logic...
}
```

---

## 🛡️ SECURITY IMPROVEMENTS

### Add Rate Limiting

Install rate limiting package:

```powershell
npm install express-rate-limit
```

Create `backend/lib/rate-limiter.js`:

```javascript
import rateLimit from 'express-rate-limit'

export const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Export pre-configured limiters
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100)
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5)
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 10)
```

### Add Input Validation to All API Routes

Use the validation schemas from `backend/lib/validation.js`:

```javascript
import { signupSchema, messageSchema } from '../../../backend/lib/validation'

// In your API route
const validated = signupSchema.safeParse(body)
if (!validated.success) {
  return NextResponse.json({ error: validated.error }, { status: 400 })
}
```

### Add Security Headers

Already configured in `next.config-secured.js`. After copying it, you'll have:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Permissions-Policy

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] `.env.local` exists and contains NEW credentials
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] `bcrypt` package installed
- [ ] `zod` package installed
- [ ] Middleware protects admin routes
- [ ] API routes require authentication
- [ ] Input validation on all endpoints
- [ ] Security headers configured
- [ ] Old credentials rotated in dashboards

---

## 🧪 TESTING

### Test Authentication

```powershell
# Start the development server
npm run dev
```

1. Try to access `/admin` without login → Should redirect to sign-in
2. Sign up with a new account → Should hash password with bcrypt
3. Try invalid email format → Should show validation error
4. Try weak password → Should show validation error

### Test API Security

```powershell
# Try accessing protected API without auth
curl http://localhost:3001/api/achievements -v
# Should return 401 Unauthorized
```

### Check for Exposed Credentials

```powershell
# Search for any remaining hardcoded credentials
Select-String -Path . -Pattern "eyJhbGci" -Recurse -Exclude "*.md","node_modules"
# Should only find them in documentation files
```

---

## 📚 UPDATED PACKAGE.JSON

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "security-check": "npm audit",
    "test": "jest",
    "migrate": "node backend/scripts/setup-database.js"
  }
}
```

---

## 🔄 GIT CLEANUP (If credentials were committed)

### Remove credentials from Git history

```powershell
# Install git-filter-repo
pip install git-filter-repo

# Backup your repo first!
Copy-Item -Recurse .git .git-backup

# Remove sensitive files from history
git filter-repo --invert-paths --path lib/supabase.js --force

# Force push (WARNING: Rewrites history!)
git push origin --force --all
```

### Update .gitignore

Ensure these are in `.gitignore`:

```
# Environment variables
.env
.env.local
.env.*.local

# Credentials
*.pem
*.key
secrets/

# Logs
logs
*.log

# OS
.DS_Store
Thumbs.db
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All credentials stored in environment variables
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry)
- [ ] Database backups configured
- [ ] Security headers enabled
- [ ] Content Security Policy configured
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated

---

## 📖 ADDITIONAL RESOURCES

### Security Tools

1. **npm audit** - Check for vulnerable dependencies
   ```powershell
   npm audit
   npm audit fix
   ```

2. **Snyk** - Continuous security monitoring
   ```powershell
   npm install -g snyk
   snyk test
   ```

3. **OWASP ZAP** - Security testing
   - Download from: https://www.zaproxy.org/

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Security](https://clerk.com/docs/security)

---

## 🆘 SUPPORT

If you encounter issues:

1. Check `SECURITY_AUDIT_AND_FIXES.md` for detailed vulnerability info
2. Review `REORGANIZATION_PLAN.md` for file structure details
3. Check logs in the terminal
4. Review Supabase logs in dashboard
5. Check Clerk logs in dashboard

---

## 📝 MAINTENANCE

### Weekly Tasks

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review security logs
- [ ] Check for suspicious activity
- [ ] Backup database

### Monthly Tasks

- [ ] Update dependencies
- [ ] Review access logs
- [ ] Security code review
- [ ] Test backup restoration

### Quarterly Tasks

- [ ] Full security audit
- [ ] Penetration testing
- [ ] Update documentation
- [ ] Review and rotate credentials

---

## ⚠️ IMPORTANT REMINDERS

1. **NEVER** commit `.env.local` to Git
2. **NEVER** hardcode credentials in source code
3. **ALWAYS** validate user input
4. **ALWAYS** use parameterized queries
5. **ALWAYS** implement proper authentication
6. **REVIEW** security before every deployment
7. **UPDATE** dependencies regularly
8. **MONITOR** logs for suspicious activity
9. **BACKUP** database regularly
10. **TEST** security measures regularly

---

**Last Updated:** January 21, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation

---

## 🎯 SUMMARY

You now have:
✅ Detailed security audit
✅ Reorganized project structure
✅ Secured backend files
✅ Proper authentication
✅ Input validation
✅ Security configurations
✅ Migration guide
✅ Testing procedures

**Next Step:** Follow the "IMMEDIATE ACTIONS" section at the top of this document!
