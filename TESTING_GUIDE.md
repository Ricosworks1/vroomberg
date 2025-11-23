# 🧪 Testing Guide - Vroomberg

## ✅ Fixes Applied

### Issue 1: Raw Error Messages ✅ FIXED
**Problem:** When rejecting MetaMask connection, you saw technical error details
**Solution:** Added friendly error handling:
- "Connection cancelled. Please approve the connection request to continue."
- Clean, user-friendly messages
- No technical jargon exposed

### Issue 2: Octav API Validation Error ✅ FIXED
**Problem:** API was returning 400 validation error
**Solution:** Fixed parameter name from `address` to `addresses` (plural)
- Octav API expects `addresses=0x...` not `address=0x...`
- Now matches their documentation

### Issue 3: Next.js Config Error ✅ FIXED
**Problem:** Server restart error about NODE_ENV
**Solution:** Removed invalid env configuration from next.config.js

### Issue 4: Security Headers Added ✅
**Added:** Production-ready security headers
- XSS protection
- Clickjacking prevention
- No-cache for API routes
- HTTPS enforcement

---

## 🎯 How to Test the Application

### Step 1: Make Sure MetaMask is Installed

**Check:** Do you have the MetaMask browser extension installed?
- Chrome: https://chrome.google.com/webstore (search "MetaMask")
- Firefox: https://addons.mozilla.org/firefox (search "MetaMask")
- Brave: Built-in wallet or install MetaMask

**Test:**
- Look for the fox icon 🦊 in your browser toolbar
- If you see it, you're good!

### Step 2: Start on ANY Network

**You do NOT need to be on Arbitrum initially!**

The app will automatically:
1. Detect your current network
2. Ask MetaMask to switch to Arbitrum
3. Add Arbitrum network if you don't have it

**Start on any network:** Ethereum, Polygon, Base, etc. - doesn't matter!

### Step 3: Open the Application

```bash
# Server should already be running
# If not, run:
npm run dev
```

Open: **http://localhost:3000**

### Step 4: Connect Your Wallet

#### What Should Happen:

**A. MetaMask Popup Appears**
```
MetaMask asks: "Connect with MetaMask?"
Shows your wallet address
```

**B. You Have Two Options:**

**Option 1: Click "Connect" (Approve)**
✅ MetaMask connects successfully
✅ App checks your network
✅ If not on Arbitrum, MetaMask asks to switch networks
✅ You approve network switch
✅ Redirected to dashboard
✅ Portfolio loads from Octav API

**Option 2: Click "Cancel" (Reject)**
✅ See friendly message: "Connection cancelled. Please approve the connection request to continue."
❌ No ugly error message
✅ Can try again

### Step 5: Test the Dashboard

Once connected and on dashboard:

#### A. Portfolio Section
**Should see:**
- Your wallet address (shortened: 0xe53B...1aEF)
- Total Balance in USD
- Number of tokens
- Number of chains
- Table with all your tokens

**If you see "No tokens found":**
- This is normal if your wallet is empty or new
- Try with a wallet that has some tokens
- Use the test wallet: 0x01031ea895b673925344535796c928791f461750

#### B. AI Trading Section
**Should see:**
- Three market condition buttons: Bear / Neutral / Bull
- "Generate AI Strategy" button

**Test AI Flow:**
1. Select market condition (e.g., "Neutral")
2. Click "Generate AI Strategy"
3. Wait 5-10 seconds
4. Strategy appears with:
   - Token recommendation
   - Grid orders (5-7 buy/sell orders)
   - Risk level
   - Expected return
5. Review AI automatically validates
6. Shows approval/rejection with confidence score
7. If approved, "Execute Strategy" button appears

---

## 🐛 Troubleshooting

### Error: "MetaMask not detected"
**Cause:** MetaMask extension not installed or disabled
**Fix:**
1. Install MetaMask browser extension
2. Make sure it's enabled
3. Refresh the page
4. Try again

### Error: "Connection cancelled"
**Cause:** You clicked "Cancel" in MetaMask
**Fix:**
1. Click "Connect MetaMask" again
2. This time click "Connect" (approve)

### Error: "Failed to switch to Arbitrum network"
**Cause:** You rejected the network switch request
**Fix:**
1. In MetaMask, manually switch to Arbitrum:
   - Click MetaMask icon
   - Click network dropdown (top of MetaMask)
   - Select "Arbitrum One"
   - Or click "Add Network" and search for Arbitrum
2. Refresh the page

### Error: "Failed to fetch portfolio data"
**Possible causes:**
1. **Octav API key is invalid** - Check .env.local has correct key
2. **Wallet has no tokens** - Normal, just shows empty state
3. **Rate limit exceeded** - Wait a minute and try again
4. **Network issue** - Check your internet connection

**Fix:**
```bash
# Check .env.local has your Octav API key:
cat .env.local | grep OCTAV_API_KEY

# Should show: OCTAV_API_KEY=eyJhbGc...
# If empty, add your key from data.octav.fi
```

### Error: "Failed to generate strategy"
**Possible causes:**
1. **Anthropic API key is invalid** - Check .env.local
2. **Rate limit exceeded** - Wait and try again
3. **Empty portfolio** - Need tokens to generate strategy

**Fix:**
```bash
# Check .env.local has your Anthropic API key:
cat .env.local | grep ANTHROPIC_API_KEY

# Should show: ANTHROPIC_API_KEY=sk-ant-api03...
# If empty, get key from console.anthropic.com
```

### Blank/White Screen
**Cause:** JavaScript error
**Fix:**
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Check Console tab for errors
3. Common fix: Clear browser cache and refresh

### Page Loads But Nothing Happens
**Cause:** MetaMask not unlocked
**Fix:**
1. Click MetaMask icon 🦊
2. Enter your password to unlock
3. Refresh the page
4. Try connecting again

---

## ✅ Success Checklist

After testing, you should have:

- [x] Connected MetaMask successfully
- [x] Switched to Arbitrum network (or manually switched)
- [x] Seen dashboard with portfolio overview
- [x] Portfolio data loaded from Octav API (or shows "No tokens" if empty)
- [x] Generated an AI strategy
- [x] Saw dual AI review (approval/rejection)
- [x] No raw error messages when cancelling connection

---

## 🎯 Expected Behavior Summary

### ✅ GOOD (Expected):
- Friendly error messages
- Smooth MetaMask popup flow
- Auto network switching to Arbitrum
- Portfolio loads (or shows empty state)
- AI generates strategy in 5-10 seconds
- Review AI validates automatically
- Clean, professional UI

### ❌ BAD (Should NOT happen):
- Raw error messages with code like "ACTION_REJECTED, version=6.14.4"
- API keys visible in browser DevTools
- Page crashes or white screen
- Infinite loading
- Multiple MetaMask popups

---

## 🔐 Security Test

### Test 1: API Keys Not Exposed
```bash
# 1. Open browser DevTools (F12)
# 2. Go to Network tab
# 3. Clear network log
# 4. Connect wallet and generate strategy
# 5. Search network tab for:
#    - "OCTAV"
#    - "ANTHROPIC"
#    - "eyJhbG" (start of Octav key)
#    - "sk-ant" (start of Anthropic key)
#
# ✅ Result: Should find 0 results
# ❌ If you find keys: STOP and notify me immediately
```

### Test 2: Console Errors
```bash
# 1. Open browser DevTools (F12)
# 2. Go to Console tab
# 3. Use the app normally
#
# ✅ Expected: No red errors (warnings ⚠️ are OK)
# ❌ If you see errors: Check the message, might be normal
```

---

## 📊 Test Scenarios

### Scenario 1: Happy Path (Everything Works)
1. Open http://localhost:3000
2. Click "Connect MetaMask"
3. Approve connection
4. Approve network switch to Arbitrum
5. See dashboard with portfolio
6. Select "Neutral" market
7. Click "Generate AI Strategy"
8. Wait for strategy
9. See Review AI approval
10. Click "Execute Strategy"
11. See execution plan

**Expected:** Everything works smoothly ✅

### Scenario 2: User Rejects Connection
1. Open http://localhost:3000
2. Click "Connect MetaMask"
3. Click "Cancel" in MetaMask
4. See friendly error: "Connection cancelled..."
5. Click "Connect MetaMask" again
6. This time click "Connect" (approve)
7. Continue normally

**Expected:** No ugly errors, can retry ✅

### Scenario 3: Empty Wallet
1. Connect with a new/empty wallet
2. Dashboard shows "No tokens found"
3. Total balance: $0.00
4. Can still try to generate strategy
5. AI might return error or minimal strategy

**Expected:** Graceful handling of empty wallet ✅

### Scenario 4: Wrong Network Initially
1. Start on Ethereum mainnet (not Arbitrum)
2. Click "Connect MetaMask"
3. Approve connection
4. MetaMask asks to switch to Arbitrum
5. Approve network switch
6. Dashboard loads normally

**Expected:** Auto network switching works ✅

---

## 🚀 Ready to Test!

**Start here:**
1. Make sure MetaMask is installed
2. Open http://localhost:3000
3. Click "Connect MetaMask"
4. Follow the prompts
5. Explore the dashboard and AI trading!

**If anything doesn't work as described above, let me know! 🎯**

---

## 📝 What Changed (Summary for You)

### Files Modified:
1. **components/WalletConnect.tsx** - Better error handling
2. **next.config.js** - Security headers, fixed config error
3. **app/api/portfolio/route.ts** - Fixed `address` → `addresses`

### Files Created:
1. **.env.local.example** - Template for environment variables
2. **SECURITY.md** - Comprehensive security guide
3. **TESTING_GUIDE.md** - This file!

### Security Improvements:
✅ No raw error messages
✅ API keys server-side only
✅ Security headers enabled
✅ Production-ready configuration

**Everything is now ready for testing and deployment!** 🎉
