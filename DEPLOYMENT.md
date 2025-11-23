# 🚀 Vroomberg Deployment Guide

## Deploy to Vercel with Custom Domain (vroomberg.com)

### Step 1: Prepare Your Project

1. **Make sure `.env.local` is in `.gitignore`** (already done ✅)
2. **Commit all changes to Git**

```bash
cd /Users/ricardomastrangelo/VS\ Studio/research_widget_for_octav

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial Vroomberg deployment - Octav Hackathon"
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it: `vroomberg` or `vroomberg-octav-hackathon`
3. Make it **public** (required for hackathon judges to review)
4. **DON'T** initialize with README (we already have one)

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/vroomberg.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. Click **"Sign Up"** (use GitHub for easy auth)
3. Click **"Add New Project"**
4. Select your `vroomberg` repository
5. Configure settings:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)

6. **Add Environment Variables:**

Click "Environment Variables" and add:

```
OCTAV_API_KEY=your_octav_api_key_here

NEXT_PUBLIC_OCTAV_API_URL=https://api.octav.fi

VROOMBERG_ANTHROPIC_API_KEY=your_anthropic_api_key_here

NEXT_PUBLIC_HYPERLIQUID_RPC=https://arb1.arbitrum.io/rpc

NEXT_PUBLIC_CHAIN_ID=42161
```

**NOTE:** Get your real API keys from:
- Octav API: [data.octav.fi](https://data.octav.fi)
- Anthropic API: [console.anthropic.com](https://console.anthropic.com)

7. Click **"Deploy"**

⏱️ **Wait 2-3 minutes for deployment to complete**

### Step 4: Add Custom Domain (vroomberg.com)

#### A. In Vercel:

1. Go to your project dashboard
2. Click **"Settings"** → **"Domains"**
3. Enter: `vroomberg.com`
4. Click **"Add"**
5. Vercel will show you DNS records to configure

You'll see something like:
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

#### B. In Bluehost DNS:

1. **Login to Bluehost**
2. Go to **"Domains"** → **"Zone Editor"**
3. Select **vroomberg.com**
4. **Delete** existing A and CNAME records for @ and www
5. **Add new records** from Vercel:

   **A Record:**
   - Type: `A`
   - Name/Host: `@`
   - Points to: `76.76.21.21` (use the IP Vercel gave you)
   - TTL: `14400` (4 hours)

   **CNAME Record:**
   - Type: `CNAME`
   - Name/Host: `www`
   - Points to: `cname.vercel-dns.com` (use the value Vercel gave you)
   - TTL: `14400`

6. Click **"Save"**

#### C. Wait for DNS Propagation

⏱️ **DNS propagation takes 5 minutes to 48 hours** (usually 10-30 minutes)

**Check status:**
```bash
# Check if DNS is propagated
nslookup vroomberg.com

# Should show Vercel's IP address
```

**Or use:** [whatsmydns.net](https://www.whatsmydns.net/) - enter `vroomberg.com`

### Step 5: Verify Deployment

Once DNS propagates:

1. **Visit [vroomberg.com](https://vroomberg.com)**
2. **Test the app:**
   - Connect MetaMask
   - View portfolio
   - Generate AI strategy
   - Check Review AI validation

✅ **Your app is now live at vroomberg.com!**

---

## 🔄 Future Updates

**To deploy updates:**

```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push

# Vercel automatically deploys on every push to main!
```

---

## 🌐 Alternative: Deploy to Vercel with Vercel Subdomain

**If you want to test first before pointing domain:**

1. Follow Steps 1-3 above
2. Skip Step 4 (custom domain)
3. Vercel will give you: `vroomberg.vercel.app`
4. Test at that URL
5. Add custom domain later

---

## 📋 Pre-Deployment Checklist

- [x] Production build successful (`npm run build`)
- [x] All environment variables documented
- [x] `.env.local` in `.gitignore`
- [x] API keys secured
- [x] README.md complete
- [x] SECURITY.md included
- [x] TESTING_GUIDE.md included
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Custom domain configured
- [ ] Live demo tested

---

## 🆘 Troubleshooting

### Issue: "Build Failed" on Vercel

**Solution:**
1. Check Vercel build logs
2. Ensure all dependencies in `package.json`
3. Verify Node version compatibility (18+)

### Issue: "API Key Missing" Error

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Verify all 5 variables are added
3. Redeploy: Deployments → ⋯ → Redeploy

### Issue: Domain Not Working After 24 Hours

**Solution:**
1. Check DNS records in Bluehost match Vercel exactly
2. Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)
3. Try incognito/private browser window
4. Contact Bluehost support

### Issue: "Invalid API Credentials" on Live Site

**Solution:**
- Check environment variables in Vercel match `.env.local` exactly
- Ensure no extra spaces or quotes
- Redeploy after fixing

---

## 📱 Share Your Deployment

**For Hackathon Submission:**

1. ✅ **Live Demo:** https://vroomberg.com
2. ✅ **GitHub Repo:** https://github.com/YOUR_USERNAME/vroomberg
3. ✅ **README:** Comprehensive documentation included
4. ✅ **Demo Video:** (optional but recommended)

---

## 🎯 What Judges Will See

1. **Professional Live Demo** at vroomberg.com
2. **Clean GitHub Repository** with comprehensive README
3. **Working Dual AI System** with real Octav data
4. **Production-Ready Code** with security best practices
5. **Clear Documentation** of architecture and API usage

---

**Good luck with the Octav Hackathon! 🚀**
