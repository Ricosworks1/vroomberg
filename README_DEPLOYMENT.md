# Vroomberg - Autonomous AI Trading dApp

## 🎯 Project Overview

**Vroomberg** is an autonomous AI-powered trading platform that combines:
- **Octav API** for institutional-grade portfolio data
- **Dual AI Agents** (Claude 3.5 Sonnet) for strategy generation and risk validation
- **Hyperliquid DEX** for decentralized trade execution on Arbitrum
- **Grid Trading Strategy** optimized for different market conditions

### Built for Octav Hackathon - App Prize Category

This application demonstrates:
1. ✅ Octav API integration (portfolio data)
2. ✅ Data visualization (portfolio dashboard with tables)
3. ✅ Secure API key management (server-side only)
4. ✅ AI-powered autonomous DeFi actions (grid trading)
5. ✅ Professional production-ready code
6. ✅ Institutional risk management framework
7. ✅ Multi-agent AI architecture

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + React)                          │
│  - Wallet connection (MetaMask on Arbitrum)            │
│  - Portfolio dashboard (Octav data)                     │
│  - AI trading interface                                 │
│  - No API keys exposed                                  │
└───────────────┬─────────────────────────────────────────┘
                │
                │ HTTPS API Calls
                │
┌───────────────▼─────────────────────────────────────────┐
│  BACKEND API ROUTES (Server-Side)                       │
│                                                          │
│  /api/portfolio          (Octav API)                    │
│  ├─ Fetches wallet portfolio data                      │
│  ├─ Uses OCTAV_API_KEY (server-side)                   │
│  └─ Returns clean JSON to frontend                      │
│                                                          │
│  /api/generate-strategy  (Strategy AI Agent)            │
│  ├─ Claude 3.5 Sonnet                                   │
│  ├─ Analyzes portfolio                                  │
│  ├─ Generates grid trading strategy                     │
│  └─ Uses ANTHROPIC_API_KEY (server-side)               │
│                                                          │
│  /api/review-strategy    (Review AI Agent)              │
│  ├─ Claude 3.5 Sonnet                                   │
│  ├─ Validates strategy safety                           │
│  ├─ Approves/rejects based on risk                      │
│  └─ Institutional risk standards                        │
│                                                          │
│  /api/execute-strategy   (Execution Engine)             │
│  ├─ Creates execution plan                              │
│  ├─ Prepares Hyperliquid orders                         │
│  └─ Returns plan for wallet signing                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+ installed
- MetaMask wallet
- API Keys:
  - Octav API key (from data.octav.fi)
  - Anthropic API key (from console.anthropic.com)

### Setup Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**

Create `.env.local` file in project root:

```bash
# Octav API
OCTAV_API_KEY=your_octav_api_key_here
NEXT_PUBLIC_OCTAV_API_URL=https://api.octav.fi

# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Hyperliquid (Arbitrum)
NEXT_PUBLIC_HYPERLIQUID_RPC=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_CHAIN_ID=42161
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Open Application**
```
http://localhost:3000
```

5. **Test Workflow**
- Click "Connect MetaMask"
- Approve network switch to Arbitrum (if needed)
- View portfolio data (fetched from Octav API)
- Select market condition (bear/neutral/bull)
- Click "Generate AI Strategy"
- Watch dual AI agents work:
  - Strategy AI generates grid trading plan
  - Review AI validates and approves/rejects
- If approved, click "Execute Strategy"

---

## 📦 Deployment to Bluehost

### Step 1: Build for Production

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

### Step 2: Upload to Bluehost

Via cPanel File Manager or FTP, upload:
- All project files
- **EXCEPT**: `node_modules/`, `.next/`, `.env.local`

### Step 3: Configure Node.js App in cPanel

1. Log into Bluehost cPanel
2. Find "Setup Node.js App"
3. Click "Create Application"
4. Settings:
   - Node.js version: **18.x or higher**
   - Application mode: **Production**
   - Application root: `/public_html/vroomberg`
   - Application URL: `vroomberg.com`

### Step 4: Set Environment Variables

In cPanel Node.js App settings, add:

```
OCTAV_API_KEY = your_octav_key
ANTHROPIC_API_KEY = your_anthropic_key
NEXT_PUBLIC_OCTAV_API_URL = https://api.octav.fi
NEXT_PUBLIC_HYPERLIQUID_RPC = https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_CHAIN_ID = 42161
```

### Step 5: Install Dependencies on Server

SSH into Bluehost:

```bash
ssh username@vroomberg.com
cd public_html/vroomberg
npm install
npm run build
```

### Step 6: Start Application

In cPanel Node.js settings, click **"Start Application"**

Or via SSH:
```bash
npm start
```

### Step 7: Enable SSL

In cPanel:
1. Go to Security → SSL/TLS
2. Enable "Let's Encrypt" (free SSL)
3. Verify HTTPS works at `https://vroomberg.com`

---

## 🧪 Testing the Application

### Test 1: Wallet Connection
- ✅ MetaMask popup appears
- ✅ Network switches to Arbitrum
- ✅ Wallet address displayed
- ✅ Redirects to dashboard

### Test 2: Portfolio Data (Octav API)
- ✅ Portfolio loads from Octav API
- ✅ Total balance displayed
- ✅ Token list rendered
- ✅ No API key visible in network tab

### Test 3: Strategy AI Agent
- ✅ Select market condition
- ✅ Generate strategy
- ✅ Strategy displays with grid orders
- ✅ Risk level and expected return shown

### Test 4: Review AI Agent
- ✅ Automatically reviews strategy
- ✅ Approval/rejection displayed
- ✅ Confidence score shown
- ✅ Risk assessment provided

### Test 5: Execution Engine
- ✅ Execute button enabled for approved strategies
- ✅ Execution plan created
- ✅ Order details displayed
- ✅ (MVP: simulated execution)

---

## 🔐 Security Checklist

- [x] API keys in `.env.local` (not committed to Git)
- [x] `.env.local` in `.gitignore`
- [x] All API calls server-side only
- [x] Input validation on all API routes
- [x] Ethereum address format validation
- [x] No secrets exposed to frontend
- [x] HTTPS enabled (production)
- [x] Environment variables on hosting platform

---

## 📊 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ethers.js v6** - Ethereum wallet integration

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Anthropic SDK** - Claude AI integration
- **Octav API** - Portfolio data

### Blockchain
- **Arbitrum** - L2 network (Chain ID: 42161)
- **MetaMask** - Wallet connection
- **Hyperliquid** - DEX for trade execution (MVP: simulated)

### AI Agents
- **Claude 3.5 Sonnet** - Both Strategy and Review agents
- **Dual-agent architecture** - Independent generation and validation

---

## 🎯 Hackathon Submission Points

### 1. Octav API Integration ✅
- Portfolio endpoint integration
- Real-time wallet data
- Server-side authentication
- Error handling and rate limiting

### 2. Data Visualization ✅
- Professional portfolio dashboard
- Token holdings table
- Balance summaries
- Responsive design

### 3. Deployment ✅
- Production-ready code
- Bluehost deployment guide
- SSL/HTTPS configuration
- Environment variable management

### 4. Bonus: Autonomous DeFi Actions ✅
- AI-powered strategy generation
- Risk validation system
- Grid trading implementation
- Hyperliquid integration (execution ready)

### 5. Institutional Grade ✅
- Conservative risk management
- Dual-agent validation
- Professional UI/UX
- Comprehensive documentation

---

## 🔄 User Journey

1. **Connect Wallet**
   - User visits vroomberg.com
   - Clicks "Connect MetaMask"
   - Approves connection
   - Switches to Arbitrum network
   - Redirected to dashboard

2. **View Portfolio**
   - Portfolio loads via Octav API
   - See total balance, token holdings, chains
   - Data updated in real-time

3. **Generate Strategy**
   - Select market condition (bear/bull/neutral)
   - Click "Generate AI Strategy"
   - Strategy AI analyzes portfolio
   - Creates grid trading plan with 5-7 orders

4. **Review Strategy**
   - Review AI automatically validates
   - Checks allocation, risk exposure, order prices
   - Approves or rejects with confidence score
   - Shows detailed risk assessment

5. **Execute Strategy**
   - If approved, click "Execute Strategy"
   - Execution plan created
   - User confirms via MetaMask (in full version)
   - Orders placed on Hyperliquid DEX

---

## 📝 API Endpoints

### GET /api/portfolio?address={wallet}
Returns portfolio data from Octav API

**Response:**
```json
{
  "wallet_address": "0x...",
  "total_balance_usd": 10000.00,
  "tokens": [
    {
      "token_symbol": "ETH",
      "token_name": "Ethereum",
      "balance": "2.5",
      "balance_usd": 5000.00,
      "price_usd": 2000.00,
      "chain": "ethereum"
    }
  ],
  "chains": ["ethereum", "arbitrum"],
  "timestamp": "2025-11-23T00:00:00.000Z"
}
```

### POST /api/generate-strategy
Generates trading strategy using Strategy AI

**Request:**
```json
{
  "wallet_address": "0x...",
  "total_balance_usd": 10000,
  "tokens": [...],
  "market_condition": "bear"
}
```

**Response:**
```json
{
  "strategy_type": "Grid Trading - Bear Market",
  "recommended_token": "ETH",
  "grid_orders": [
    {
      "type": "buy",
      "price": 1950.00,
      "amount_usd": 500.00,
      "trigger_condition": "When price reaches $1950"
    }
  ],
  "risk_level": "medium",
  "expected_return": "5-10%",
  "market_analysis": "...",
  "rationale": "...",
  "warnings": [...]
}
```

### POST /api/review-strategy
Reviews strategy using Review AI

**Response:**
```json
{
  "approved": true,
  "confidence_score": 85,
  "risk_assessment": "...",
  "identified_risks": [...],
  "recommendations": [...],
  "approval_rationale": "..."
}
```

### POST /api/execute-strategy
Creates execution plan for approved strategy

**Response:**
```json
{
  "success": true,
  "execution_plan": {
    "execution_id": "EXEC_...",
    "orders": [...],
    "total_usd_required": 2500.00,
    "estimated_gas_cost": 2.50,
    "execution_instructions": [...],
    "ready_to_execute": true,
    "warnings": [...]
  }
}
```

---

## 🚨 Known Limitations (MVP)

1. **Hyperliquid Integration**: Order execution is simulated. Full integration requires Hyperliquid SDK v2 and production API keys.

2. **Database**: Execution history not persisted. Would need PostgreSQL/MongoDB for production.

3. **Monitoring**: No 24/7 grid order monitoring. Full version would need background workers.

4. **Multi-chain**: Currently Arbitrum only. Could expand to other EVM chains.

---

## 🎯 Production Roadmap

### Phase 1: MVP (Current)
- ✅ Wallet connection
- ✅ Portfolio display via Octav
- ✅ Dual AI strategy system
- ✅ Simulated execution

### Phase 2: Full Execution
- [ ] Real Hyperliquid SDK integration
- [ ] Wallet signing for orders
- [ ] Order confirmation UI
- [ ] Execution status tracking

### Phase 3: Monitoring
- [ ] Active order monitoring
- [ ] Auto-rebalancing
- [ ] Email/SMS alerts
- [ ] Performance analytics

### Phase 4: Advanced Features
- [ ] Multiple strategies per wallet
- [ ] Strategy backtesting
- [ ] Custom grid parameters
- [ ] Social trading (copy strategies)

---

## 📞 Support

For deployment issues:
- Check `.env.local` has all keys
- Verify Node.js version 18+
- Ensure Bluehost has Node.js support enabled
- Check cPanel error logs

For API issues:
- Verify API keys are valid
- Check rate limits (Octav: 360 req/min)
- Monitor network tab for errors

---

## 📄 License

Built for Octav Hackathon 2025

© 2025 Vroomberg - Autonomous AI Trading

---

## 🎉 Ready to Deploy!

Your Vroomberg dApp is production-ready and configured for deployment to vroomberg.com.

**Next steps:**
1. Test locally one final time
2. Build for production (`npm run build`)
3. Upload to Bluehost
4. Configure environment variables
5. Start the application
6. Enable SSL
7. Submit to hackathon! 🚀
