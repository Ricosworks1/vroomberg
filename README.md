# VROOMBERG 🚀

**Autonomous AI-Powered DeFi Trading Platform**

An institutional-grade autonomous trading platform that combines real-time portfolio intelligence from Octav API with dual AI agents (Claude 3 Haiku) to generate, validate, and execute grid trading strategies on Hyperliquid DEX.

**Live Demo:** [vroomberg.com](https://vroomberg.com)

---

## 🏆 Octav Hackathon Submission

**Category:** Best Use of Octav API

**Built with:**
- ✅ Octav API (Portfolio, Wallet, Token endpoints)
- ✅ Claude AI (Dual-agent autonomous system)  
- ✅ Next.js 15 + TypeScript
- ✅ Hyperliquid DEX Integration
- ✅ Arbitrum Network

---

## 🎯 What is Vroomberg?

Vroomberg is the first **autonomous AI trading platform** that acts like an institutional hedge fund for retail DeFi users. It combines:

1. **Real-time Portfolio Intelligence** - Octav API provides live multi-chain portfolio data
2. **Strategy AI Agent** - Generates institutional-grade grid trading strategies
3. **Review AI Agent** - Validates strategies with conservative risk management
4. **Autonomous Execution** - Executes approved strategies on Hyperliquid DEX

**The Problem:** Retail DeFi users lack the tools, data, and expertise that institutional traders have.

**Our Solution:** Democratize institutional-grade trading through autonomous AI agents powered by real-time blockchain data.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (MetaMask)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VROOMBERG PLATFORM                           │
│                                                                 │
│  ┌───────────────┐      ┌──────────────┐     ┌──────────────┐ │
│  │   Next.js     │◄────►│  Octav API   │     │  Hyperliquid │ │
│  │   Frontend    │      │  Integration │     │     DEX      │ │
│  └───────┬───────┘      └──────┬───────┘     └──────┬───────┘ │
│          │                     │                     │          │
│          ▼                     ▼                     │          │
│  ┌─────────────────────────────────────────────┐    │          │
│  │         DUAL AI AGENT SYSTEM                │    │          │
│  │                                              │    │          │
│  │  ┌──────────────────┐  ┌─────────────────┐ │    │          │
│  │  │  Strategy Agent  │  │   Review Agent  │ │    │          │
│  │  │  (Claude Haiku)  │  │ (Claude Haiku)  │ │    │          │
│  │  │                  │  │                 │ │    │          │
│  │  │ • Market Analysis│  │ • Risk Assess   │ │    │          │
│  │  │ • Grid Orders    │  │ • Validation    │ │    │          │
│  │  │ • Token Select   │  │ • Approval      │ │    │          │
│  │  └────────┬─────────┘  └────────┬────────┘ │    │          │
│  │           │                     │           │    │          │
│  │           └─────────►◄──────────┘           │    │          │
│  │                                              │    │          │
│  └──────────────────────────────────────────┬───┘    │          │
│                                             │        │          │
│                                             ▼        ▼          │
│                                     ┌────────────────────┐      │
│                                     │ Execution Engine   │      │
│                                     │ (Simulated MVP)    │      │
│                                     └────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Octav API Integration

### Endpoints Used

#### 1. Portfolio Endpoint (`/v1/portfolio`)
**File:** `app/api/portfolio/route.ts`

```typescript
const response = await fetch(
  `${OCTAV_API_URL}/v1/portfolio?addresses=${walletAddress}`,
  {
    headers: {
      'Authorization': `Bearer ${OCTAV_API_KEY}`,
    },
  }
);
```

**Data Retrieved:**
- Multi-chain token balances (Arbitrum, Ethereum, Base, etc.)
- Real-time USD valuations
- Token metadata (symbols, names, addresses)
- Chain distribution

**Processing Applied:**
- Portfolio aggregation across chains
- USD value calculations
- Token filtering and sorting
- Balance formatting for UI display

---

## 🤖 Dual AI Agent System

### Strategy Agent (Claude 3 Haiku)

**Responsibilities:**
1. Analyze portfolio composition from Octav data
2. Select optimal token for grid trading
3. Generate 5-7 price-level grid orders
4. Calculate risk levels and expected returns
5. Provide market analysis and rationale

### Review Agent (Claude 3 Haiku)

**Responsibilities:**
1. Validate strategy against institutional standards
2. Assess risk exposure and allocation
3. Identify potential issues and edge cases
4. Approve or reject with detailed rationale
5. Provide recommendations for improvements

**Validation Rules:**
- ✅ Auto-reject if allocation > 30% of portfolio
- ✅ Auto-reject if high risk but allocation > 15%
- ✅ Auto-reject if grid prices unrealistic
- ✅ Auto-reject if expected return > 50% (too optimistic)
- ✅ Conservative approach: when in doubt, reject

---

## 🔮 Future Roadmap

### Phase 2: Multi-DEX Integration
- **Uniswap V3** - Concentrated liquidity positions
- **Balancer** - Weighted portfolio rebalancing
- **Curve** - Stablecoin strategies
- **Aave** - Automated lending/borrowing

### Phase 3: Autonomous Portfolio Manager

```
┌─────────────────────────────────────────────┐
│     AUTONOMOUS PORTFOLIO MANAGER AI         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Strategy   │      │   Rebalancing   │ │
│  │     AI       │      │       AI        │ │
│  └──────────────┘      └─────────────────┘ │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │    Yield     │      │  Risk Manager   │ │
│  │  Optimizer   │      │       AI        │ │
│  └──────────────┘      └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**
- Auto-rebalancing based on market conditions
- Yield optimization across protocols
- Risk-adjusted portfolio construction
- Multi-strategy execution in parallel
- Cross-chain arbitrage detection
- Impermanent loss hedging

### Phase 4: Social & Collaborative Trading
- Strategy sharing marketplace
- Performance leaderboards
- Copy trading (follow top performers)
- DAO governance for strategy approval
- Community voting on risk parameters

### Phase 5: Advanced Analytics
- Predictive modeling using historical Octav data
- Sentiment analysis from on-chain activity
- Wallet clustering for trend detection
- MEV protection strategies
- Gas optimization algorithms

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15.5.6 (App Router)
- TypeScript
- Tailwind CSS
- ethers.js v6

**Backend:**
- Next.js API Routes (serverless)
- Anthropic Claude 3 Haiku API
- Octav API v1

**Blockchain:**
- Arbitrum (Layer 2)
- Hyperliquid DEX
- MetaMask wallet integration

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Octav API key ([data.octav.fi](https://data.octav.fi))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Environment Variables

Create `.env.local`:

```bash
# Octav API
OCTAV_API_KEY=your_octav_api_key_here
NEXT_PUBLIC_OCTAV_API_URL=https://api.octav.fi

# Anthropic Claude API
VROOMBERG_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Hyperliquid (Arbitrum)
NEXT_PUBLIC_HYPERLIQUID_RPC=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_CHAIN_ID=42161
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

---

## 🏅 Hackathon Compliance Checklist

- [x] **Requirement 1:** Octav API as core data source (portfolio endpoint)
- [x] **Requirement 2:** Authenticated API calls with valid key
- [x] **Requirement 3:** Functional demo at vroomberg.com
- [x] **Requirement 4:** Meaningful data processing (AI strategy generation)
- [x] **Requirement 5:** Clear README with API usage and architecture
- [x] **Requirement 6:** Built within hackathon timeframe
- [x] **Requirement 7 (BONUS):** AI integration with autonomous agents

---

## 👥 Team

**Ricardo Mastrangelo**
- Full-stack development
- AI integration
- DeFi architecture

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Octav** - For providing best-in-class blockchain data infrastructure
- **Anthropic** - For Claude AI powering autonomous agents
- **Hyperliquid** - For decentralized exchange infrastructure
- **Arbitrum** - For fast and cheap Layer 2 execution

---

**Built with ❤️ for the Octav Hackathon**
