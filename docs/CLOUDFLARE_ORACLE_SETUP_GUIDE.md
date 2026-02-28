# 🚀 Complete Setup Guide: Cloudflare + Oracle Cloud
# For Anurag Dattes App

---

## 📋 PART 0: Endpoint Security Audit — What's Still Public?

### ✅ PROTECTED (Cannot be accessed without login)
| Endpoint | Protection |
|----------|-----------|
| `GET /api/profiles?userId=...` | IDOR + Auth — only your own data |
| `GET /api/profiles/count` | Auth required |
| `GET /api/events` | Auth required |
| `GET /api/matches?userId=...` | IDOR — only your own matches |
| `GET /api/likes?userId=...` | IDOR — only your own likes |
| `GET /api/warnings?userId=...` | IDOR — only your own warnings |
| `GET /api/friend-request/sent` | IDOR — only your own |
| `GET /api/friend-request/pending` | IDOR — only your own |
| `GET /api/blocked-users?userId=...` | IDOR — only your own |

### ⚠️ INTENTIONALLY PUBLIC (Safe — these MUST be public)
| Endpoint | Why It's OK to Be Public |
|----------|--------------------------|
| `POST /api/auth/signup` | Must be open so new users can register |
| `POST /api/auth/login` | Must be open so users can log in |
| `POST /api/auth/admin-login` | Protected by username+password |
| `POST /api/create-profile-clerk` | Called during first-time setup |

### 🔴 STILL UNPROTECTED — Need Auth Added
| Endpoint | Risk Level | Fix Needed |
|----------|-----------|------------|
| `GET /api/leaderboard` | Low — no personal data | Optional |
| `GET /api/online` | Medium — reveals who's online | Add requireAuth |
| `GET /api/messages?matchId=...` | 🔴 HIGH — chat messages! | Add requireOwnership |
| `GET /api/ban-status?userId=...` | Medium | Add requireAuth |
| `GET /api/dice/matches` | Medium | Add requireAuth |
| `GET /api/dice/active-matches` | Medium | Add requireAuth |
| `GET /api/dice/who-selected-me` | Medium | Add requireAuth |
| `POST /api/messages` | 🔴 HIGH — sending fake messages! | Add requireAuth |
| `POST /api/likes` | Medium | Add requireAuth |
| `POST /api/friend-request/send` | Medium | Add requireAuth |
| `GET /api/admin/*` | 🔴 CRITICAL — but protected by password | Move to proper Admin auth |

> **Action Required:** The most urgent one is `GET /api/messages` — someone could
> read private chat messages with just a matchId. Fix this ASAP (see below).

---

## 📋 PART 1: Fix Remaining Critical Endpoints (Do This First!)

### Fix `GET /api/messages` (Highest Priority!)

In `route.js`, find `handleGetMessages` and add at the top:

```javascript
async function handleGetMessages(request) {
  try {
    // 🔒 SECURITY: Require authentication to read messages
    const authCheck = await requireAuth(request)
    if (!authCheck.authorized) return authCheck.response

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    // ... rest of the function
```

### Fix `POST /api/messages` (Prevent Fake Messages!)

In `handleSendMessage`, add at the top:

```javascript
async function handleSendMessage(request) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.authorized) return authCheck.response
    // ... rest of the function
```

### Fix `GET /api/online` (Who's Online)

```javascript
async function handleGetOnlineUsers(request) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.authorized) return authCheck.response
    // ... rest
```

---

## ☁️ PART 2: Cloudflare Setup (Step by Step)

### What Cloudflare Does:
```
Internet User
      ↓
  Cloudflare   ← Filters attacks, hides your real IP
      ↓
 Your Server   ← Only sees clean traffic
```

---

### Step 1: Sign Up for Cloudflare (Free)

1. Go to **https://cloudflare.com**
2. Click **"Sign Up"** → Create free account
3. Click **"Add a Site"**
4. Enter your domain (e.g., `anuragdattes.com`)
5. Select **Free plan** → Click Continue

---

### Step 2: Cloudflare Scans Your DNS Records

- Cloudflare will automatically detect your existing DNS records
- **Review them** to make sure everything looks correct
- Click **Continue**

---

### Step 3: Change Nameservers at Your Domain Registrar

Cloudflare will show you 2 nameservers like:
```
audrey.ns.cloudflare.com
bret.ns.cloudflare.com
```

**Go to wherever you bought your domain** (GoDaddy, Namecheap, BigRock, etc.):
1. Find **"Manage Nameservers"** or **"DNS Settings"**
2. Delete the existing nameservers
3. Add the TWO Cloudflare nameservers
4. Save and **wait 10 minutes to 24 hours** for it to activate

✅ When done, Cloudflare will email you: "Great news! Cloudflare is now protecting your site"

---

### Step 4: Configure SSL/TLS

In Cloudflare Dashboard:
1. Click **SSL/TLS** (left menu)
2. Set mode to: **Full (strict)** ← Important! Not just "Full"
3. Click **Edge Certificates**
4. Turn ON: **"Always Use HTTPS"**
5. Turn ON: **"Automatic HTTPS Rewrites"**
6. Turn ON: **"HTTP Strict Transport Security (HSTS)"**

---

### Step 5: Set Up Firewall / Security Rules

Go to **Security → WAF** → Click **"Create Rule"**

#### Rule 1: Block SQL Injection and XSS attacks (Auto)
- Go to **Security → Settings**
- Set Security Level to: **"High"**
- Enable: **Bot Fight Mode** (Free feature, blocks bots)

#### Rule 2: Rate Limit Login (Prevent Brute Force)
Go to **Security → Rate Limiting** → Create Rule:
```
Name: Block login brute force
URL: *anuragdattes.com/api/auth/login*
Requests: 5
Period: 1 minute
Action: Block for 1 hour
```

#### Rule 3: Rate Limit Signup (Prevent Spam Accounts)
```
Name: Block signup spam
URL: *anuragdattes.com/api/auth/signup*  
Requests: 3
Period: 1 minute
Action: Block for 6 hours
```

---

### Step 6: Enable DDoS Protection

Go to **Security → DDoS**:
- HTTP DDoS attack protection: **"High"**
- This is automatic on Cloudflare Free plan

---

### Step 7: Speed Settings (Bonus)

Go to **Speed → Optimization**:
- Enable **"Auto Minify"** → Check JS, CSS, HTML
- Enable **"Brotli"** compression

---

## 🖥️ PART 3: Oracle Cloud (Free VM to Host Your App)

Oracle Cloud gives you a **FREE server forever** (Always Free tier).
It's better than Vercel Free because:
- No cold start delays
- Your real IP is completely hidden behind Cloudflare
- No request limits

### Step 1: Create Oracle Cloud Account

1. Go to **https://cloud.oracle.com**
2. Click **"Start for free"**
3. Sign up (requires a credit card for verification — NOT charged)
4. Choose **Home Region** → Select **"India South (Hyderabad)"** for low latency

---

### Step 2: Create a Free VM Instance

1. In Oracle Console → Click **"Instances"** (under Compute)
2. Click **"Create Instance"**
3. Configure:
   - **Name:** `anurag-dattes-server`
   - **Image:** Ubuntu 22.04 (free tier)
   - **Shape:** `VM.Standard.A1.Flex` (ARM — **4 OCPU, 24GB RAM FREE!**)
   - **Boot Volume:** 200GB (free)
4. **Add SSH Key:**
   - Click "Generate a key pair for me"
   - **Download both private and public keys** (save them safely!)
5. Click **Create**

---

### Step 3: Open Ports on Oracle Firewall

After VM is created:
1. Click on your instance → Click **"Subnet"**
2. Click **"Default Security List"**
3. Click **"Add Ingress Rules"** → Add these:

| Source CIDR | Protocol | Port | Purpose |
|-------------|----------|------|---------|
| 0.0.0.0/0 | TCP | 22 | SSH access |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 3000 | Next.js app |

Also open the OS-level firewall. SSH into your server then run:
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

### Step 4: Connect to Your VM via SSH

On your **Windows PC**, open PowerShell:
```powershell
ssh -i C:\path\to\your-private-key.key ubuntu@YOUR_VM_PUBLIC_IP
```
Replace `YOUR_VM_PUBLIC_IP` with the IP shown in Oracle Console.

---

### Step 5: Install Node.js on the VM

Once connected via SSH:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (keeps your app running forever)
sudo npm install -g pm2

# Verify
node --version   # Should show v20.x.x
npm --version
```

---

### Step 6: Deploy Your App to Oracle VM

**On your Windows PC**, upload your project:
```powershell
# Install rsync or use scp to copy files
scp -i C:\path\to\key.key -r C:\Users\goudb\Downloads\anurag_project\anurag_dattes\frontend ubuntu@YOUR_VM_IP:~/app
```

**On the Oracle VM** (via SSH):
```bash
cd ~/app

# Install dependencies
npm install

# Create your .env.local file
nano .env.local
# Paste all your environment variables here (Clerk keys, Supabase keys, etc.)
# Press Ctrl+X, then Y, then Enter to save

# Build the app
npm run build

# Start with PM2 (runs forever, restarts on crash)
pm2 start npm --name "anurag-dattes" -- start
pm2 startup   # Makes it auto-start on server reboot
pm2 save
```

Your app is now running on `http://YOUR_VM_IP:3000`

---

### Step 7: Install Nginx as Reverse Proxy

Nginx sits in front of Next.js and handles HTTPS:

```bash
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/anurag-dattes
```

Paste this config:
```nginx
server {
    listen 80;
    server_name anuragdattes.com www.anuragdattes.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/anurag-dattes /etc/nginx/sites-enabled/
sudo nginx -t          # Test config (should say OK)
sudo systemctl restart nginx
```

---

### Step 8: Point Cloudflare to Your Oracle VM

In **Cloudflare Dashboard → DNS**:

Add these records:
| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `YOUR_ORACLE_VM_IP` | ✅ Proxied (Orange Cloud) |
| A | `www` | `YOUR_ORACLE_VM_IP` | ✅ Proxied (Orange Cloud) |

> **CRITICAL:** Make sure the cloud icon is **ORANGE** (Proxied).
> This means traffic goes through Cloudflare FIRST.
> Your Oracle VM's real IP is now completely hidden! 🔒

---

### Step 9: Get Free SSL via Cloudflare

Since Cloudflare handles SSL for you, you don't need to install certificates on your server!

In Cloudflare → **SSL/TLS**:
- Mode: **Full (strict)**

In Cloudflare → **SSL/TLS → Origin Server**:
- Click **"Create Certificate"**
- Select validity: **15 years**
- Download the certificate and key
- Install on your Nginx:

```bash
sudo mkdir /etc/nginx/ssl
sudo nano /etc/nginx/ssl/cloudflare.pem   # Paste certificate
sudo nano /etc/nginx/ssl/cloudflare.key   # Paste private key
```

Update Nginx config to use HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name anuragdattes.com www.anuragdattes.com;

    ssl_certificate /etc/nginx/ssl/cloudflare.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare.key;

    location / {
        proxy_pass http://localhost:3000;
        # ... rest of proxy settings
    }
}
server {
    listen 80;
    return 301 https://$host$request_uri;  # Force HTTPS
}
```

---

## 📊 Final Architecture After Setup

```
Student's Phone/Laptop
         ↓ HTTPS
    ☁️ CLOUDFLARE
    • Hides your Oracle VM IP
    • Blocks DDoS attacks
    • Rate limits login attempts
    • WAF blocks SQL injection
         ↓
   🖥️ ORACLE VM (Free!)
    Nginx (port 443)
         ↓
    Next.js App (port 3000)
    • Auth checks (Clerk)
    • IDOR protection
    • Security logging
         ↓
   🗄️ SUPABASE DATABASE
    • security_logs table
    • profiles, matches, etc.
```

---

## 🎯 Summary: What Each Layer Protects

| Threat | Protected By |
|--------|-------------|
| DDoS attack | Cloudflare |
| Brute force login | Cloudflare Rate Limiting |
| Finding your server IP | Cloudflare Proxy |
| Accessing API without login | Code (requireAuth) |
| Accessing OTHER user's data | Code (requireOwnership/IDOR) |
| SQL injection | Cloudflare WAF + Supabase parameterized queries |
| Spam accounts | Cloudflare Rate Limiting on /api/auth/signup |
| Admin unauthorized access | Admin password + Clerk middleware |
| Seeing who hacked you | Security Logs (admin panel tab) |

---

## ✅ Quick Checklist

### Today (Code — Already Done ✅):
- [x] requireAuth on /api/profiles, /api/events, /api/profiles/count
- [x] IDOR protection on profiles, matches, likes, warnings, friend requests, blocked users
- [x] Security logging to Supabase
- [x] Admin panel security logs tab
- [ ] **Run the SQL** in Supabase SQL Editor (CREATE_SECURITY_LOGS_TABLE.sql)
- [ ] **Fix /api/messages** — add requireAuth (still exposed!)

### This Week (Cloudflare — Free):
- [ ] Sign up at cloudflare.com
- [ ] Add your site and change nameservers
- [ ] Set SSL to Full (strict)
- [ ] Enable Bot Fight Mode
- [ ] Add Rate Limiting rules for /api/auth/login and /api/auth/signup

### Optional (Oracle — Free VM):
- [ ] Create Oracle Cloud account
- [ ] Launch free ARM VM (4 CPU, 24GB RAM — worth it!)
- [ ] Deploy app + set up Nginx
- [ ] Point Cloudflare DNS to Oracle VM
