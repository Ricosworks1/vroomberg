# Vroomberg - Autonomous Trading dApp

## Final Specification

**Domain**: vroomberg.com (Bluehost hosting)
**Type**: Decentralized Application (dApp)
**User Flow**: Connect wallet → Autonomous AI trading
**Chains**: EVM-compatible (Arbitrum primary)
**Trading**: Hyperliquid DEX
**Data**: Octav API for portfolio intelligence

---

## User Journey

### Step 1: Landing Page
```
User visits: https://vroomberg.com

┌─────────────────────────────────────────┐
│  VROOMBERG                              │
│  Autonomous AI Trading for DeFi         │
│                                         │
│  [CONNECT WALLET]                       │
│                                         │
│  Supported: MetaMask, WalletConnect     │
└─────────────────────────────────────────┘
```

### Step 2: Wallet Connection
```
User clicks "Connect Wallet"
→ MetaMask popup
→ User approves connection
→ Verify on Arbitrum network
→ If wrong network, prompt to switch
```

### Step 3: Portfolio Analysis
```
┌─────────────────────────────────────────┐
│  Welcome, 0x01031...1750                │
│                                         │
│  Analyzing your portfolio via Octav... │
│                                         │
│  ✓ Portfolio Value: $20,551             │
│  ✓ Available Liquidity: $16,440         │
│  ✓ Positions: 3 assets                 │
│  ✓ Network: Arbitrum ✓                 │
│                                         │
│  [CONFIGURE AI TRADING STRATEGY]        │
└─────────────────────────────────────────┘
```

### Step 4: Strategy Configuration
```
┌─────────────────────────────────────────┐
│  SET YOUR TRADING GOALS                 │
│                                         │
│  Goal: [Always increase portfolio value]│
│                                         │
│  Risk: ( ) Conservative                 │
│        (•) Moderate                     │
│        ( ) Aggressive                   │
│                                         │
│  Trading Pairs: [ETH/USDC] ✓           │
│                                         │
│  Max Position: [20]% of portfolio       │
│                                         │
│  [GENERATE AI STRATEGY]                 │
└─────────────────────────────────────────┘
```

### Step 5: AI Strategy Review
```
┌─────────────────────────────────────────┐
│  AI STRATEGY GENERATED                  │
│                                         │
│  Strategy AI: "Conservative Grid ETH"   │
│  Review AI: "APPROVED (Risk: 4/10)"     │
│                                         │
│  BUY ORDERS (5):                        │
│  • $2,400 | $1,000                     │
│  • $2,300 | $1,500                     │
│  • $2,200 | $2,000                     │
│  • $2,100 | $2,000                     │
│  • $2,000 | $1,500                     │
│                                         │
│  SELL ORDERS (5):                       │
│  • $2,600 | 0.385 ETH                  │
│  • $2,700 | 0.556 ETH                  │
│  • $2,800 | 0.714 ETH                  │
│  • $2,900 | 0.862 ETH                  │
│  • $3,000 | 1.000 ETH                  │
│                                         │
│  [APPROVE & START TRADING]              │
└─────────────────────────────────────────┘
```

### Step 6: Live Trading Dashboard
```
┌─────────────────────────────────────────┐
│  VROOMBERG - LIVE                       │
│  Status: TRADING ● [PAUSE] [STOP]       │
├─────────────────────────────────────────┤
│  Portfolio: $20,551 → $21,042 (+2.4%)  │
│  24h Trades: 12                         │
│  Active Orders: 8/10                    │
│                                         │
│  RECENT ACTIVITY:                       │
│  • 14:32 Buy filled @ $2,200 (+0.9 ETH)│
│  • 14:20 Sell filled @ $2,700 (+$1,500)│
│  • 14:15 AI: Rebalancing grid...       │
│                                         │
│  [VIEW FULL HISTORY] [MODIFY STRATEGY]  │
└─────────────────────────────────────────┘
```

---

## Technical Architecture (dApp)

### Frontend (React dApp)
```typescript
// 1. Wallet Connection
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

const connectWallet = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  // Verify Arbitrum
  if (network.chainId !== 42161) {
    await switchToArbitrum();
  }

  return { provider, signer, address };
};

// 2. Switch to Arbitrum
const switchToArbitrum = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xA4B1' }], // 42161 in hex
    });
  } catch (error) {
    // If network not added, add it
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xA4B1',
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io']
      }]
    });
  }
};

// 3. Portfolio from Octav
const getPortfolio = async (address) => {
  const response = await fetch(`/api/portfolio?address=${address}`);
  return response.json();
};

// 4. Generate Strategy (AI)
const generateStrategy = async (config) => {
  const response = await fetch('/api/generate-strategy', {
    method: 'POST',
    body: JSON.stringify(config)
  });
  return response.json();
};

// 5. Execute Trades
const startTrading = async (strategy, signer) => {
  const response = await fetch('/api/execute-strategy', {
    method: 'POST',
    body: JSON.stringify({ strategy, address: await signer.getAddress() })
  });
  return response.json();
};
```

### Backend API Routes
```
/api/portfolio
├─ GET portfolio data from Octav
├─ Calculate liquidity
└─ Return formatted data

/api/generate-strategy
├─ POST user configuration
├─ Call Strategy AI (Claude)
├─ Call Review AI (Claude)
└─ Return approved strategy

/api/execute-strategy
├─ POST strategy + user address
├─ Connect to Hyperliquid
├─ Place all grid orders
└─ Return order confirmations

/api/monitor
├─ Continuous monitoring loop
├─ Check Octav for portfolio changes
├─ Check Hyperliquid for fills
├─ Rebalance if needed
└─ WebSocket updates to frontend
```

### Smart Contract Interaction (Hyperliquid)
```typescript
import { HyperliquidSDK } from '@hyperliquid/sdk';

const executeOrders = async (strategy, signer) => {
  const hyperliquid = new HyperliquidSDK({
    network: 'arbitrum',
    signer: signer
  });

  const orders = [];

  // Place buy orders
  for (const buy of strategy.buyOrders) {
    const tx = await hyperliquid.placeOrder({
      symbol: 'ETH/USDC',
      side: 'BUY',
      type: 'LIMIT',
      price: buy.price,
      size: buy.amount,
      timeInForce: 'GTC'
    });

    orders.push(tx);
  }

  // Place sell orders
  for (const sell of strategy.sellOrders) {
    const tx = await hyperliquid.placeOrder({
      symbol: 'ETH/USDC',
      side: 'SELL',
      type: 'LIMIT',
      price: sell.price,
      size: sell.amount,
      timeInForce: 'GTC'
    });

    orders.push(tx);
  }

  return orders;
};
```

---

## File Structure

```
vroomberg/
├── app/
│   ├── page.tsx                 # Landing page (wallet connect)
│   ├── dashboard/
│   │   └── page.tsx            # Trading dashboard
│   ├── api/
│   │   ├── portfolio/
│   │   │   └── route.ts        # Octav integration
│   │   ├── generate-strategy/
│   │   │   └── route.ts        # Strategy AI
│   │   ├── execute-strategy/
│   │   │   └── route.ts        # Hyperliquid execution
│   │   └── monitor/
│   │       └── route.ts        # Monitoring loop
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── WalletConnect.tsx       # Wallet connection button
│   ├── PortfolioView.tsx       # Portfolio display
│   ├── StrategyConfig.tsx      # Strategy configuration
│   ├── StrategyReview.tsx      # AI-generated strategy review
│   ├── TradingDashboard.tsx    # Live trading dashboard
│   └── ActivityLog.tsx         # Transaction history
├── lib/
│   ├── octav.ts               # Octav API client
│   ├── hyperliquid.ts         # Hyperliquid SDK wrapper
│   ├── strategyAI.ts          # Claude strategy generation
│   ├── reviewAI.ts            # Claude review agent
│   └── wallet.ts              # Wallet utilities
├── public/
│   └── logo.svg
├── .env.local
│   ├── OCTAV_API_KEY
│   ├── ANTHROPIC_API_KEY
│   └── NEXT_PUBLIC_HYPERLIQUID_RPC
└── package.json
```

---

## Deployment to Bluehost (vroomberg.com)

### Option 1: Static Export (Simplest)
```bash
# 1. Build static site
npm run build

# 2. Export static files
npx next export

# 3. Upload 'out' folder to Bluehost
# Via FTP or cPanel File Manager
# Point domain to /out directory
```

### Option 2: Node.js on Bluehost (Full Features)
```bash
# 1. Enable Node.js in cPanel
# 2. Set Node.js version to 18+
# 3. Upload project files
# 4. Install dependencies
npm install

# 5. Set environment variables in cPanel
OCTAV_API_KEY=...
ANTHROPIC_API_KEY=...

# 6. Start application
npm run build
npm start

# 7. Point domain to application
```

### Domain Configuration:
```
vroomberg.com → Points to Next.js app
SSL Certificate → Enable in cPanel (free Let's Encrypt)
```

---

## Implementation Checklist

### Phase 1: Wallet Connection (1 hour)
- [ ] Add ethers.js
- [ ] Build WalletConnect component
- [ ] Add network detection (Arbitrum)
- [ ] Add network switching
- [ ] Test with MetaMask

### Phase 2: Octav Integration (30 min)
- [ ] Create /api/portfolio route
- [ ] Fetch portfolio data
- [ ] Calculate liquidity
- [ ] Display in UI

### Phase 3: AI Agents (2 hours)
- [ ] Build Strategy AI (Claude)
- [ ] Build Review AI (Claude)
- [ ] Create /api/generate-strategy
- [ ] Test with real data

### Phase 4: Hyperliquid Integration (2 hours)
- [ ] Install Hyperliquid SDK
- [ ] Build order placement
- [ ] Create /api/execute-strategy
- [ ] Test on testnet first

### Phase 5: UI/UX (1.5 hours)
- [ ] Landing page design
- [ ] Strategy configuration modal
- [ ] Trading dashboard
- [ ] Activity log
- [ ] Responsive design

### Phase 6: Monitoring Loop (1 hour)
- [ ] Background monitoring service
- [ ] WebSocket for live updates
- [ ] Rebalancing logic
- [ ] Error handling

### Phase 7: Deploy (1 hour)
- [ ] Build for production
- [ ] Upload to Bluehost
- [ ] Configure domain
- [ ] SSL certificate
- [ ] Final testing

**Total: 9 hours**

---

## Quick Start Commands

```bash
# 1. Install dependencies
npm install ethers @hyperliquid/sdk @anthropic-ai/sdk

# 2. Add environment variables
# .env.local:
OCTAV_API_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_HYPERLIQUID_RPC=https://arb1.arbitrum.io/rpc

# 3. Run dev server
npm run dev

# 4. Test wallet connection
# Open http://localhost:3000
# Connect MetaMask on Arbitrum

# 5. Build for production
npm run build

# 6. Deploy to Bluehost
# Upload build files via FTP/cPanel
```

---

## Security Considerations

### User Wallet Safety:
- ✅ Never ask for private keys
- ✅ All transactions user-approved
- ✅ Clear transaction previews
- ✅ Pausable/stoppable anytime

### API Keys:
- ✅ Server-side only (never exposed)
- ✅ Environment variables
- ✅ Not in Git

### Trading Limits:
- ✅ Max position size enforced
- ✅ Max orders per day
- ✅ Slippage protection
- ✅ Emergency stop button

---

## READY TO CODE?

We're building:
- ✅ Full dApp on vroomberg.com
- ✅ Wallet connection (MetaMask/WalletConnect)
- ✅ Multi-agent AI trading
- ✅ Hyperliquid execution
- ✅ Octav portfolio intelligence

**Should I start coding the wallet connection first?** 🚀
