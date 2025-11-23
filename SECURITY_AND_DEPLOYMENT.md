# Security & Deployment Guide - Vroomberg dApp

## 🔒 SECURITY FIRST - Critical Rules

### NEVER Do These:
❌ **NEVER** commit API keys to Git
❌ **NEVER** store private keys in code
❌ **NEVER** ask users for private keys
❌ **NEVER** expose API keys in frontend
❌ **NEVER** hardcode sensitive data

### ALWAYS Do These:
✅ **ALWAYS** use environment variables for secrets
✅ **ALWAYS** keep API keys server-side only
✅ **ALWAYS** use .gitignore for .env files
✅ **ALWAYS** validate user input
✅ **ALWAYS** use HTTPS (SSL)

---

## 📁 File Structure (What Goes Where)

### Files That Are SAFE to Commit:
```
✅ All code files (.ts, .tsx, .js)
✅ Package.json
✅ README.md
✅ Public assets
✅ Configuration files (next.config.js)
```

### Files That Must NEVER Be Committed:
```
❌ .env.local (API keys)
❌ .env (any environment file)
❌ node_modules/
❌ .next/ (build files)
❌ Private keys
❌ Wallet seeds
```

---

## 🔐 Environment Variables Setup

### Step 1: Create .env.local File
```bash
# In your project root, create this file:
touch .env.local
```

### Step 2: Add Your Secrets
```bash
# .env.local (NEVER COMMIT THIS FILE!)

# Octav API Key (from data.octav.fi)
OCTAV_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic Claude API Key (from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Public variables (safe to expose to frontend)
NEXT_PUBLIC_CHAIN_ID=42161
NEXT_PUBLIC_NETWORK_NAME=Arbitrum One
```

### Step 3: Verify .gitignore
```bash
# Make sure .gitignore includes:
.env.local
.env*.local
.env
node_modules
.next
```

---

## 🏗️ Project Structure (Security-Aware)

```
vroomberg/
├── .env.local                  # ❌ NEVER COMMIT - API keys here
├── .gitignore                  # ✅ MUST HAVE - protects secrets
├── app/
│   ├── api/                    # 🔒 SERVER-SIDE ONLY
│   │   ├── portfolio/          # Safe: API keys used here
│   │   │   └── route.ts        # Server-side Octav calls
│   │   ├── generate-strategy/  # Safe: Claude API here
│   │   │   └── route.ts
│   │   └── execute-strategy/   # Safe: Trading execution
│   │       └── route.ts
│   ├── page.tsx                # 🌐 PUBLIC - No secrets here
│   └── dashboard/              # 🌐 PUBLIC - No secrets here
│       └── page.tsx
├── components/                 # 🌐 PUBLIC - No secrets here
│   ├── WalletConnect.tsx       # Safe: Only wallet connection
│   └── TradingDashboard.tsx    # Safe: Only displays data
├── lib/                        # ⚠️ MIXED
│   ├── wallet.ts               # Public: Frontend helpers
│   └── octav.ts                # Private: Import in API routes only
└── package.json                # ✅ Safe to commit
```

---

## 🔐 How Secrets Work (Architecture)

```
┌─────────────────────────────────────────────────┐
│  USER'S BROWSER (Frontend)                      │
│  ❌ NO API KEYS HERE                            │
│  ❌ NO PRIVATE KEYS HERE                        │
│                                                  │
│  Only has:                                       │
│  - User's wallet address (public)               │
│  - UI code                                       │
│  - Wallet connection (MetaMask)                 │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTPS Request
                   │ (No secrets exposed)
                   ▼
┌─────────────────────────────────────────────────┐
│  YOUR SERVER (Bluehost/Vercel)                  │
│  ✅ API KEYS STORED HERE                        │
│  ✅ ENVIRONMENT VARIABLES                       │
│                                                  │
│  /api/portfolio                                  │
│  ├─ Reads OCTAV_API_KEY from .env.local        │
│  ├─ Calls Octav API server-to-server           │
│  └─ Returns clean data to frontend              │
│                                                  │
│  /api/generate-strategy                         │
│  ├─ Reads ANTHROPIC_API_KEY from .env.local    │
│  ├─ Calls Claude API server-to-server          │
│  └─ Returns strategy to frontend                │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Authenticated API Call
                   │ (Server-to-Server)
                   ▼
┌─────────────────────────────────────────────────┐
│  OCTAV API / CLAUDE API                         │
│  ✅ Receives authenticated request              │
│  ✅ Returns data                                │
└─────────────────────────────────────────────────┘
```

**Key Point**: API keys NEVER leave your server. Frontend only calls YOUR server, YOUR server calls external APIs.

---

## 🚀 Deployment Steps (Bluehost)

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel?**
- Free tier available
- Automatic HTTPS
- Environment variables built-in
- Zero-config Next.js deployment
- Easy subdomain (vroomberg.vercel.app)
- Can point vroomberg.com to it

**Steps:**

#### 1. Sign up for Vercel
```
Visit: https://vercel.com
Sign up with GitHub
```

#### 2. Install Vercel CLI
```bash
npm install -g vercel
```

#### 3. Deploy from your project
```bash
# In your project directory
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: vroomberg
# - Directory: ./ (current)
# - Build settings: Auto-detected ✓
```

#### 4. Set Environment Variables
```bash
# In Vercel Dashboard:
# 1. Go to project settings
# 2. Click "Environment Variables"
# 3. Add each variable:

OCTAV_API_KEY = eyJhbGc...
ANTHROPIC_API_KEY = sk-ant-...
```

#### 5. Point Domain
```bash
# In Vercel Dashboard:
# 1. Go to project settings
# 2. Click "Domains"
# 3. Add custom domain: vroomberg.com
# 4. Follow DNS instructions

# In Bluehost:
# 1. Go to Domains → DNS
# 2. Add CNAME record:
#    - Name: @
#    - Value: cname.vercel-dns.com
```

#### 6. Deploy Updates
```bash
# After making changes:
git add .
git commit -m "Update"
git push

# Vercel auto-deploys on push
```

---

### Option 2: Bluehost (More Control)

**Steps:**

#### 1. Enable Node.js in cPanel
```
1. Log into Bluehost cPanel
2. Find "Setup Node.js App"
3. Click "Create Application"
4. Settings:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: /vroomberg
   - Application URL: vroomberg.com
```

#### 2. Upload Project Files
```bash
# Via FTP or cPanel File Manager:
# Upload all files EXCEPT:
# - node_modules/ (will install on server)
# - .next/ (will build on server)
# - .env.local (set separately)
```

#### 3. Set Environment Variables
```
In cPanel Node.js App settings:
Add environment variables:
- OCTAV_API_KEY = your_key_here
- ANTHROPIC_API_KEY = your_key_here
```

#### 4. Install Dependencies
```bash
# SSH into Bluehost
ssh username@vroomberg.com

# Navigate to app
cd vroomberg

# Install
npm install

# Build
npm run build
```

#### 5. Start Application
```bash
# In cPanel Node.js settings:
Click "Start Application"

# Or via SSH:
npm start
```

#### 6. Configure Domain
```
In cPanel:
1. Go to Domains
2. Ensure vroomberg.com points to application
3. Enable SSL (Let's Encrypt - Free)
```

---

## 🔒 Security Checklist

### Before Deployment:

- [ ] ✅ .env.local in .gitignore
- [ ] ✅ No API keys in code files
- [ ] ✅ All secrets in environment variables
- [ ] ✅ API routes validate inputs
- [ ] ✅ CORS configured properly
- [ ] ✅ Rate limiting on API routes
- [ ] ✅ SSL/HTTPS enabled

### Code Security:

```typescript
// ❌ BAD - API key exposed
const OCTAV_KEY = "eyJhbGc...";  // NEVER DO THIS

// ✅ GOOD - API key from environment
const OCTAV_KEY = process.env.OCTAV_API_KEY;


// ❌ BAD - API key sent to frontend
export function getApiKey() {
  return process.env.OCTAV_API_KEY;  // NEVER DO THIS
}

// ✅ GOOD - API key used server-side only
export async function getPortfolio(address: string) {
  const response = await fetch('https://api.octav.fi/v1/portfolio', {
    headers: {
      'Authorization': `Bearer ${process.env.OCTAV_API_KEY}`
    }
  });
  return response.json();
}


// ❌ BAD - No input validation
app.get('/api/portfolio', (req) => {
  const address = req.query.address;
  // Use address without checking
});

// ✅ GOOD - Input validation
app.get('/api/portfolio', (req) => {
  const address = req.query.address;

  // Validate Ethereum address
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { error: 'Invalid address' };
  }

  // Safe to use
});
```

---

## 🧪 Testing Security

### Test 1: API Keys Not Exposed
```bash
# Check browser console
# Open DevTools → Network
# Connect wallet
# Check API calls
# Verify: No API keys visible in requests
```

### Test 2: Environment Variables Working
```bash
# In your code, add temporary log:
console.log('Octav key exists:', !!process.env.OCTAV_API_KEY);

# Should see: true
# Should NOT see actual key
```

### Test 3: HTTPS Enabled
```bash
# Visit: https://vroomberg.com
# Check: Green padlock in browser
# Click padlock → Certificate valid
```

---

## 📝 Deployment Workflow

### Daily Development:
```bash
# 1. Work locally
npm run dev

# 2. Test changes
# Visit http://localhost:3000

# 3. Commit (API keys stay safe)
git add .
git commit -m "Add feature"

# 4. Push to GitHub
git push

# 5. Auto-deploys to Vercel
# Or manually deploy to Bluehost
```

### Environment Variables Update:
```bash
# If you need to change API keys:

# Vercel:
# 1. Go to dashboard
# 2. Settings → Environment Variables
# 3. Edit variable
# 4. Redeploy

# Bluehost:
# 1. cPanel → Node.js App
# 2. Edit environment variables
# 3. Restart application
```

---

## 🚨 If Something Goes Wrong

### If API Key Gets Exposed:
```bash
1. IMMEDIATELY rotate the key
   - Octav: data.octav.fi → regenerate
   - Claude: console.anthropic.com → regenerate

2. Update .env.local with new key

3. Update deployment env vars

4. Redeploy

5. Delete exposed commit from Git history
```

### If .env.local Gets Committed:
```bash
# Remove from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (careful!)
git push origin --force --all

# Rotate ALL API keys immediately
```

---

## ✅ Pre-Launch Checklist

- [ ] All API keys in .env.local (not in code)
- [ ] .env.local in .gitignore
- [ ] Environment variables set on hosting platform
- [ ] HTTPS/SSL enabled
- [ ] Domain pointed correctly
- [ ] Test wallet connection works
- [ ] Test Octav API calls work
- [ ] Test Claude AI works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] API rate limits configured
- [ ] Error handling works
- [ ] Emergency stop button works

---

## 🎯 Final Architecture Summary

```
vroomberg.com (Your Domain)
    │
    ├─ Frontend (Public)
    │  ├─ React Components
    │  ├─ Wallet Connection
    │  └─ UI/UX
    │
    ├─ Backend API Routes (Private)
    │  ├─ /api/portfolio (uses OCTAV_API_KEY)
    │  ├─ /api/generate-strategy (uses ANTHROPIC_API_KEY)
    │  └─ /api/execute-strategy (uses wallet signing)
    │
    └─ Environment Variables (Secret)
       ├─ OCTAV_API_KEY (server only)
       ├─ ANTHROPIC_API_KEY (server only)
       └─ Never exposed to frontend
```

**Key Principle**:
> "Users connect their wallet (safe), your server uses API keys (safe), keys never meet."

---

## Ready to Build?

Now that security is clear, let's start building the actual code!

**Next Step**: Build wallet connection component

Shall I proceed? 🚀
