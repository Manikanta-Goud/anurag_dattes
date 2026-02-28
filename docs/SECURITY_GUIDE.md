# 🔐 Security Guide — Anurag Dattes App

## What Was Found (Vulnerabilities)

Your cybersecurity friend found 3 real issues. Here's a plain-language explanation of each one:

---

### 🔴 Vulnerability 1: `/api/profiles?userId=UUID`

**What happened:**  
Anyone could call this endpoint with ANY user's ID and get their full profile including name, age, email, bio, social media links, and photos — without being logged in at all.

**Why it happened:**  
The `handleGetProfiles` function in `route.js` had no authentication check. It trusted the `userId` query parameter completely.

**Fix applied (in route.js):**  
Added `requireAuth(request)` at the top of the handler — rejects with `401 Unauthorized` if no valid Clerk session token is in the request.

---

### 🔴 Vulnerability 2: `/api/events?status=all` (calling itself many times)

**What happened:**  
Events were being fetched every 10 seconds, starting immediately when the page loaded — **before** the user was even logged in! So the request was going out unauthenticated, and since the handler had no auth check, events were being returned to anyone.

**Why it happened:**  
The `useEffect` in `page.js` had `[]` as its dependency (ran on mount) and called `loadEvents()` every 10 seconds unconditionally.

**Fix applied (in page.js):**  
The `useEffect` now depends on `currentUser` and only runs after login. Interval also changed from 10s → 60s.

**Fix applied (in route.js):**  
Added `requireAuth(request)` inside `handleGetEvents`.

---

### 🟡 Vulnerability 3: `/api/profiles/count`

**What happened:**  
The total number of registered users was visible to anyone without logging in.

**Fix applied (in route.js):**  
Added `requireAuth(request)` — now returns `401` if not authenticated.

---

## ✅ Fixes Applied (Summary)

| File | Change |
|------|--------|
| `route.js` | Added `requireAuth()` helper using Clerk's `getAuth()` |
| `route.js` | `handleGetProfiles` now requires auth |
| `route.js` | `handleGetProfileCount` now requires auth |
| `route.js` | `handleGetEvents` now requires auth |
| `page.js` | Events polling now only starts after login |
| `page.js` | Events polling interval: 10s → 60s |

---

## ☁️ Cloudflare Integration Guide

Cloudflare acts as a **reverse proxy** — all traffic goes through Cloudflare FIRST before reaching your server. This hides your real server's IP address and adds DDoS protection, rate limiting, and firewalling.

### Step 1 — Sign Up for Cloudflare (Free)

1. Go to [cloudflare.com](https://cloudflare.com) and create a free account
2. Click **"Add a Site"** and enter your domain name (e.g., `anuragdattes.com`)
3. Select the **Free plan**

### Step 2 — Change Your DNS to Cloudflare

Cloudflare will show you two nameservers like:
```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

1. Go to where you registered your domain (e.g., GoDaddy, Namecheap, etc.)
2. Replace the existing nameservers with Cloudflare's nameservers
3. Wait 0–48 hours for DNS propagation

### Step 3 — Enable SSL/TLS

In Cloudflare dashboard:
1. Go to **SSL/TLS** → **Overview**
2. Set mode to **"Full (strict)"**
3. Go to **SSL/TLS** → **Edge Certificates** → Enable **"Always Use HTTPS"**

### Step 4 — Enable Cloudflare Firewall Rules

In Cloudflare dashboard → **Security** → **WAF** (Web Application Firewall):

#### Rule 1: Block direct IP access (hides your server)
```
Field: URI Path
Operator: does not contain
Value: /api/auth/
Action: Block
```

#### Rule 2: Rate limit login attempts
1. Go to **Security** → **Rate Limiting**
2. Add rule:
   - URL pattern: `/api/auth/login`
   - Threshold: 5 requests per 1 minute per IP
   - Action: Block for 1 hour

#### Rule 3: Block suspicious user agents
```
Field: User Agent
Operator: contains
Value: curl OR python-requests OR postman
Action: Challenge (CAPTCHA)
```

### Step 5 — DDoS Protection

Cloudflare Free plan automatically protects against:
- Layer 3/4 DDoS attacks
- Port scanning
- IP flooding

Go to **Security** → **DDoS** → Set to **"High"** sensitivity.

### Step 6 — Deploy to Vercel + Configure Cloudflare

If deploying to Vercel:
1. Deploy app to Vercel → get URL like `yourapp.vercel.app`
2. In Cloudflare, Add a CNAME DNS record:
   ```
   Type: CNAME
   Name: @ (or www)
   Target: cname.vercel-dns.com
   Proxy: ✅ Enabled (orange cloud)
   ```
3. This way traffic goes: **User → Cloudflare → Vercel** (Vercel IP hidden!)

---

## 🛡️ Additional Security Measures Already in Your Code

Your code already has:
- ✅ Clerk authentication middleware (`middleware.js`)
- ✅ Rate limiting (100 req/15 min per IP)
- ✅ Security headers (X-Frame-Options, X-XSS-Protection, CSP, etc.)
- ✅ Zod input validation on signup/login/profile update
- ✅ HSTS in production
- ✅ Ban system with middleware check

---

## 🚨 Additional Things to Fix (Recommended)

### 1. Admin password is hardcoded! 
In `route.js` line ~1113:
```js
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: hashPassword('admin123')  // ← CHANGE THIS!
}
```
Move this to an environment variable in `.env.local`:
```
ADMIN_PASSWORD=your_strong_password_here
```

### 2. Enable Supabase Row Level Security (RLS)

In your Supabase dashboard:
1. Go to **Database** → **Tables** → `profiles`
2. Enable **RLS**
3. Add policy: "Users can only read their own profile data"

This is a **defense in depth** measure — even if your API is bypassed, the database layer blocks unauthorized reads.

### 3. Don't expose UUIDs in URLs

Instead of `GET /api/profiles?userId=c9a80322-5dde-46fc-a3d5-d381c467a826`, use the Clerk session to get the user ID server-side rather than passing it in the query string.

---

## Summary: What Cloudflare Does vs What Code Fixes Do

| Protection | Cloudflare | Code Fix |
|-----------|-----------|---------|
| Hide your server IP | ✅ Yes | ❌ No |
| DDoS protection | ✅ Yes | ❌ No |
| Rate limiting | ✅ Yes (+ you have in-memory) | ✅ Already exists |
| Block unauthenticated API calls | ❌ No | ✅ Yes (the fix we just did) |
| Prevent data leaks | ❌ No | ✅ Yes (auth check in handlers) |
| WAF (block SQL injection, XSS) | ✅ Yes (paid plans) | Partial |

**You need BOTH** — Cloudflare hides your infrastructure, but the code fixes prevent logic-level data leaks.
