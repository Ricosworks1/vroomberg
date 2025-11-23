# Autonomous Portfolio Trading System - Complete Design

## What You Want to Build (Clarified)

**The Vision:**
> "An AI-powered autonomous trading system that executes grid trading strategies on Hyperliquid, using Octav portfolio data for decision-making, with human oversight and AI self-review mechanisms."

**Goal:** Replace human traders with an autonomous AI system that trades more frequently and consistently than humans can.

---

## The Core Strategy: Cascading Grid Trading

### What It Is:
**Grid Trading** = Place multiple buy orders at decreasing prices (bear market) and sell orders at increasing prices (bull market)

### Example Execution:
```
Current Market: ETH = $2,500
Portfolio: $20,000 (80% liquid, 20% in positions)

BUY ORDERS (Cascade during dips):
├─ Buy $1,000 ETH @ $2,400 (-4%)
├─ Buy $1,500 ETH @ $2,300 (-8%)
├─ Buy $2,000 ETH @ $2,200 (-12%)
├─ Buy $2,500 ETH @ $2,100 (-16%)
└─ Buy $3,000 ETH @ $2,000 (-20%)

SELL ORDERS (Cascade during rallies):
├─ Sell $1,000 ETH @ $2,600 (+4%)
├─ Sell $1,500 ETH @ $2,700 (+8%)
├─ Sell $2,000 ETH @ $2,800 (+12%)
├─ Sell $2,500 ETH @ $2,900 (+16%)
└─ Sell $3,000 ETH @ $3,000 (+20%)

Result: Profit from volatility, accumulate in bear, distribute in bull
```

### Why This Strategy Works:
1. **Exploits Volatility** - Crypto markets are highly volatile
2. **No Market Timing Needed** - Works in any market
3. **Automated** - Executes 24/7 without emotion
4. **Risk Managed** - Predefined position sizes
5. **Non-Gameable** - Orders adjust dynamically based on portfolio

---

## System Architecture (5 Core Components)

```
┌─────────────────────────────────────────────────────────────┐
│                    HUMAN INTERFACE (UI)                     │
│  - Set initial strategy parameters                         │
│  - Monitor AI agent performance                            │
│  - Override/pause if needed                                │
│  - View profit/loss reports                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           STRATEGY AI AGENT (Claude)                        │
│  - Interprets human goals                                  │
│  - Designs grid trading parameters                         │
│  - Adjusts strategy based on market conditions             │
│  - Updates based on performance                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           REVIEW AI AGENT (Claude)                          │
│  - Validates strategy before execution                     │
│  - Checks risk parameters                                  │
│  - Approves/rejects proposed trades                        │
│  - Monitors for anomalies                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           EXECUTION ENGINE                                  │
│  - Places orders on Hyperliquid                            │
│  - Monitors order fills                                    │
│  - Rebalances grid dynamically                             │
│  - Handles errors/retries                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           DATA LAYER                                        │
│  - Octav API: Portfolio composition & liquidity            │
│  - Hyperliquid API: Market data & order execution          │
│  - Historical data: Performance tracking                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Data Retrieval (Octav API)

### Purpose:
Know exactly what the portfolio holds and how much liquidity is available for trading

### Implementation:
```typescript
interface PortfolioData {
  totalValue: number;           // $20,551
  liquidityAvailable: number;   // $16,440 (80% liquid)
  positions: {
    asset: string;              // "ETH", "USDC", etc.
    amount: number;             // 5.2 ETH
    value: number;              // $13,000
    percentage: number;         // 63%
    protocol: string;           // "Hyperliquid", "Wallet"
  }[];
  chains: string[];             // ["Arbitrum"]
}

async function getPortfolioData(): Promise<PortfolioData> {
  const response = await fetch('https://api.octav.fi/v1/portfolio?addresses=0x...', {
    headers: { 'Authorization': `Bearer ${OCTAV_API_KEY}` }
  });

  const data = await response.json();

  return {
    totalValue: data.networth,
    liquidityAvailable: calculateLiquidity(data),
    positions: extractPositions(data),
    chains: extractChains(data)
  };
}

function calculateLiquidity(data): number {
  // Calculate how much cash is available to trade
  // = Wallet holdings + liquid DEX positions - locked positions
  const walletBalance = data.assetByProtocols.wallet.value;
  const hyperliquidBalance = data.assetByProtocols.hyperliquid?.value || 0;
  const lockedPositions = calculateLockedPositions(data);

  return walletBalance + hyperliquidBalance - lockedPositions;
}
```

### What We Extract:
1. **Total Portfolio Value** - $20,551
2. **Available Liquidity** - $16,440 (what we can trade with)
3. **Current Positions** - What assets we hold
4. **Asset Distribution** - How balanced is the portfolio
5. **Chain Distribution** - Confirm we're on Arbitrum

---

## Component 2: Strategy AI Agent (Claude)

### Purpose:
Human sets high-level goal ("always increase portfolio value"), AI translates into specific trading strategy

### Human Input (UI):
```typescript
interface StrategyInput {
  goal: string;                 // "Maximize portfolio value"
  riskTolerance: "conservative" | "moderate" | "aggressive";
  tradingPairs: string[];      // ["ETH/USDC", "BTC/USDC"]
  maxPositionSize: number;     // 20% of portfolio
  gridLevels: number;          // 5 buy + 5 sell orders
  priceRange: {
    buyBelow: number;          // -20% from current
    sellAbove: number;         // +20% from current
  };
}
```

### AI Agent Processing:
```typescript
async function designTradingStrategy(
  input: StrategyInput,
  portfolioData: PortfolioData,
  marketData: MarketData
): Promise<TradingStrategy> {

  const prompt = `You are a professional quantitative trader managing a $${portfolioData.totalValue} crypto portfolio.

PORTFOLIO DATA:
${JSON.stringify(portfolioData, null, 2)}

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

HUMAN GOALS:
- Objective: ${input.goal}
- Risk Tolerance: ${input.riskTolerance}
- Trading Pairs: ${input.tradingPairs.join(', ')}

TASK:
Design a grid trading strategy that:
1. Places cascading buy orders during market dips
2. Places cascading sell orders during rallies
3. Uses ${input.gridLevels} levels for each side
4. Respects max position size of ${input.maxPositionSize}%
5. Works within ${input.priceRange.buyBelow}% to ${input.priceRange.sellAbove}% range
6. Ensures portfolio remains balanced according to Octav data

Provide a detailed grid trading plan with:
- Exact price levels for each order
- Position sizes for each level
- Risk management rules
- Rebalancing triggers
- Performance metrics to track

Format as structured JSON.`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const strategy = JSON.parse(response.content[0].text);

  return strategy;
}
```

### AI Output (Trading Strategy):
```json
{
  "strategyName": "Conservative Grid - ETH/USDC",
  "assetPair": "ETH/USDC",
  "currentPrice": 2500,
  "portfolioAllocation": {
    "maxExposure": "20%",
    "maxPerOrder": "$2000"
  },
  "buyOrders": [
    {
      "level": 1,
      "price": 2400,
      "priceChange": "-4%",
      "amount": "$1000",
      "ethAmount": "0.417",
      "reasoning": "First support level, small accumulation"
    },
    {
      "level": 2,
      "price": 2300,
      "priceChange": "-8%",
      "amount": "$1500",
      "ethAmount": "0.652",
      "reasoning": "Stronger dip, increase position"
    },
    {
      "level": 3,
      "price": 2200,
      "priceChange": "-12%",
      "amount": "$2000",
      "ethAmount": "0.909",
      "reasoning": "Significant dip, max single order"
    },
    {
      "level": 4,
      "price": 2100,
      "priceChange": "-16%",
      "amount": "$2000",
      "ethAmount": "0.952",
      "reasoning": "Major support, maintain max size"
    },
    {
      "level": 5,
      "price": 2000,
      "priceChange": "-20%",
      "amount": "$2000",
      "ethAmount": "1.0",
      "reasoning": "Bottom of range, final accumulation"
    }
  ],
  "sellOrders": [
    {
      "level": 1,
      "price": 2600,
      "priceChange": "+4%",
      "amount": "0.385 ETH",
      "usdcAmount": "$1000",
      "reasoning": "First resistance, take small profit"
    },
    {
      "level": 2,
      "price": 2700,
      "priceChange": "+8%",
      "amount": "0.556 ETH",
      "usdcAmount": "$1500",
      "reasoning": "Stronger rally, increase profit-taking"
    },
    // ... more sell levels
  ],
  "riskManagement": {
    "stopLoss": "No hard stop (grid strategy)",
    "maxDrawdown": "20%",
    "rebalanceTrigger": "Portfolio >30% in single asset",
    "liquidityReserve": "Keep 20% in USDC for opportunities"
  },
  "performanceMetrics": {
    "expectedProfitPerCycle": "2-4%",
    "optimalVolatility": "3-5% daily",
    "rebalanceFrequency": "Every 4 hours"
  },
  "aiReasoning": "This conservative grid captures profits from ETH volatility while maintaining portfolio balance. Buy orders accumulate during dips with increasing position sizes. Sell orders distribute during rallies. Total exposure capped at 20% ensures diversification. Strategy adapts to current $16,440 liquidity."
}
```

---

## Component 3: Review AI Agent (Second Claude Instance)

### Purpose:
AI reviews AI - validates strategy before execution to catch errors/risks

### Implementation:
```typescript
async function reviewStrategy(
  proposedStrategy: TradingStrategy,
  portfolioData: PortfolioData
): Promise<ReviewResult> {

  const prompt = `You are a risk management AI reviewing a proposed trading strategy.

PROPOSED STRATEGY:
${JSON.stringify(proposedStrategy, null, 2)}

CURRENT PORTFOLIO:
${JSON.stringify(portfolioData, null, 2)}

REVIEW CHECKLIST:
1. Does strategy respect portfolio liquidity limits?
2. Are position sizes within safe bounds?
3. Is portfolio balance maintained?
4. Are price levels realistic and achievable?
5. Does risk management make sense?
6. Are there any obvious flaws or risks?

Provide:
- APPROVED or REJECTED
- Specific concerns or improvements
- Risk score (1-10, 10=highest risk)
- Recommended modifications if any

Format as JSON.`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Review Output:
```json
{
  "status": "APPROVED",
  "riskScore": 4,
  "riskLevel": "LOW-MEDIUM",
  "concerns": [
    {
      "type": "MINOR",
      "issue": "Total buy orders ($8,500) could exceed available liquidity if all fill",
      "recommendation": "Reduce level 5 buy order from $2,000 to $1,500"
    }
  ],
  "approvals": [
    "✓ Position sizes within 20% portfolio limit",
    "✓ Price levels span realistic range (-20% to +20%)",
    "✓ Liquidity reserve maintained (20% USDC)",
    "✓ Rebalancing triggers appropriate",
    "✓ No concentration risk created"
  ],
  "modifications": {
    "buyOrders[4].amount": "$1500"  // Reduce level 5 buy
  },
  "aiReasoning": "Strategy is sound overall. Minor adjustment needed to prevent liquidity exhaustion if all buy orders fill simultaneously. Risk score of 4/10 indicates low-moderate risk appropriate for stated 'conservative' approach.",
  "finalApproval": true
}
```

---

## Component 4: Execution Engine (Hyperliquid Integration)

### What is Hyperliquid?
- Decentralized perpetual futures exchange
- Built on Arbitrum (Layer 2)
- High liquidity, low fees
- Programmatic trading API

### Tech Stack for Execution:
```typescript
// 1. Hyperliquid SDK
import { HyperliquidSDK } from '@hyperliquid/sdk';

// 2. Wallet Integration (for signing)
import { ethers } from 'ethers';

// 3. Order Management
interface OrderManager {
  placeOrder(params: OrderParams): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<boolean>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  getAllOrders(): Promise<Order[]>;
}
```

### Order Placement:
```typescript
async function executeTradingStrategy(
  strategy: TradingStrategy,
  wallet: ethers.Wallet
): Promise<ExecutionResult> {

  const hyperliquid = new HyperliquidSDK({
    network: 'arbitrum',
    privateKey: wallet.privateKey
  });

  const placedOrders = [];

  // Place all buy orders
  for (const buyOrder of strategy.buyOrders) {
    const order = await hyperliquid.placeOrder({
      symbol: 'ETH/USDC',
      side: 'BUY',
      type: 'LIMIT',
      price: buyOrder.price,
      size: buyOrder.ethAmount,
      timeInForce: 'GTC'  // Good Till Cancelled
    });

    placedOrders.push({
      ...order,
      level: buyOrder.level,
      direction: 'BUY',
      reasoning: buyOrder.reasoning
    });

    // Log to database
    await logOrder(order, 'BUY', buyOrder);
  }

  // Place all sell orders
  for (const sellOrder of strategy.sellOrders) {
    const order = await hyperliquid.placeOrder({
      symbol: 'ETH/USDC',
      side: 'SELL',
      type: 'LIMIT',
      price: sellOrder.price,
      size: sellOrder.amount,
      timeInForce: 'GTC'
    });

    placedOrders.push({
      ...order,
      level: sellOrder.level,
      direction: 'SELL',
      reasoning: sellOrder.reasoning
    });

    await logOrder(order, 'SELL', sellOrder);
  }

  return {
    totalOrders: placedOrders.length,
    buyOrders: placedOrders.filter(o => o.direction === 'BUY').length,
    sellOrders: placedOrders.filter(o => o.direction === 'SELL').length,
    orders: placedOrders
  };
}
```

### Continuous Monitoring & Rebalancing:
```typescript
async function monitorAndRebalance() {
  while (true) {
    // 1. Check portfolio via Octav
    const portfolio = await getPortfolioData();

    // 2. Check filled orders on Hyperliquid
    const filledOrders = await hyperliquid.getFilledOrders();

    // 3. Determine if rebalancing needed
    if (shouldRebalance(portfolio, filledOrders)) {

      // 4. Ask Strategy AI for new grid
      const newStrategy = await designTradingStrategy(userInput, portfolio, marketData);

      // 5. Review AI validates
      const review = await reviewStrategy(newStrategy, portfolio);

      if (review.finalApproval) {
        // 6. Cancel old orders
        await cancelAllOrders();

        // 7. Place new grid
        await executeTradingStrategy(newStrategy, wallet);

        // 8. Log rebalancing event
        await logRebalance(portfolio, newStrategy, 'Auto-rebalance triggered');
      }
    }

    // Check every 5 minutes
    await sleep(300000);
  }
}

function shouldRebalance(portfolio, filledOrders): boolean {
  // Rebalance if:
  // 1. Portfolio becomes >30% concentrated in one asset
  if (portfolio.positions.some(p => p.percentage > 30)) return true;

  // 2. >50% of grid orders have filled
  const fillRate = filledOrders.length / totalGridOrders;
  if (fillRate > 0.5) return true;

  // 3. Market moved >10% from grid center
  const priceChange = calculatePriceChange();
  if (Math.abs(priceChange) > 0.1) return true;

  return false;
}
```

---

## Component 5: User Interface (Slick UX/UI)

### Dashboard Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  AUTONOMOUS TRADING SYSTEM                    [PAUSE] [STOP] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PORTFOLIO STATUS (Octav API)                       │   │
│  │                                                       │   │
│  │  Total Value: $20,551.08                            │   │
│  │  Available Liquidity: $16,440.80 (80%)              │   │
│  │  Active Positions: 3                                │   │
│  │  Chain: Arbitrum ✓                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ACTIVE STRATEGY                                     │   │
│  │                                                       │   │
│  │  Name: Conservative Grid ETH/USDC                   │   │
│  │  Status: RUNNING                                     │   │
│  │  Grid: 5 Buy Orders + 5 Sell Orders                │   │
│  │  Range: $2,000 - $3,000                             │   │
│  │                                                       │   │
│  │  BUY ORDERS:                                         │   │
│  │  ├─ $2,400 | $1,000 | [PENDING]                    │   │
│  │  ├─ $2,300 | $1,500 | [PENDING]                    │   │
│  │  ├─ $2,200 | $2,000 | [FILLED] ✓                   │   │
│  │  ├─ $2,100 | $2,000 | [PENDING]                    │   │
│  │  └─ $2,000 | $1,500 | [PENDING]                    │   │
│  │                                                       │   │
│  │  SELL ORDERS:                                        │   │
│  │  ├─ $2,600 | 0.385 ETH | [PENDING]                 │   │
│  │  ├─ $2,700 | 0.556 ETH | [FILLED] ✓                │   │
│  │  ├─ $2,800 | 0.714 ETH | [PENDING]                 │   │
│  │  ├─ $2,900 | 0.862 ETH | [PENDING]                 │   │
│  │  └─ $3,000 | 1.000 ETH | [PENDING]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI ACTIVITY LOG                                     │   │
│  │                                                       │   │
│  │  14:32 - Strategy AI: Rebalancing grid center...    │   │
│  │  14:30 - Review AI: Strategy approved (Risk: 4/10)  │   │
│  │  14:25 - Execution: Buy filled @ $2,200 (+0.909 ETH)│   │
│  │  14:20 - Execution: Sell filled @ $2,700 (+$1,500)  │   │
│  │  14:15 - Portfolio check: 68% ETH, 32% USDC ✓      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PERFORMANCE                                         │   │
│  │                                                       │   │
│  │  24h Profit: +$420 (+2.04%)                         │   │
│  │  7d Profit: +$1,680 (+8.9%)                         │   │
│  │  Total Trades: 47                                    │   │
│  │  Win Rate: 72%                                       │   │
│  │  Sharpe Ratio: 1.8                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [MODIFY STRATEGY]  [VIEW FULL AUDIT LOG]  [EXPORT REPORT]  │
└─────────────────────────────────────────────────────────────┘
```

### Strategy Configuration Modal:
```
┌─────────────────────────────────────────┐
│  CONFIGURE TRADING STRATEGY             │
├─────────────────────────────────────────┤
│                                         │
│  Goal:                                  │
│  ┌───────────────────────────────────┐ │
│  │ Always increase portfolio value   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Risk Tolerance:                        │
│  ( ) Conservative  (•) Moderate  ( ) Aggressive │
│                                         │
│  Trading Pairs:                         │
│  [x] ETH/USDC                          │
│  [ ] BTC/USDC                          │
│  [ ] SOL/USDC                          │
│                                         │
│  Max Position Size: [20]%              │
│                                         │
│  Grid Levels: [5] buy + [5] sell       │
│                                         │
│  Price Range:                           │
│  Buy below: [-20]%                     │
│  Sell above: [+20]%                    │
│                                         │
│  [GENERATE STRATEGY WITH AI]            │
└─────────────────────────────────────────┘
```

---

## Wallet Integration (No MCP Needed)

### What You Need:
```typescript
// 1. ethers.js for wallet connection
import { ethers } from 'ethers';

// 2. WalletConnect or MetaMask
import { Web3Provider } from '@ethersproject/providers';

// 3. Hyperliquid SDK
import { HyperliquidSDK } from '@hyperliquid/sdk';

// Connect wallet
async function connectWallet() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

// Sign transactions
async function signAndExecute(transaction, signer) {
  const tx = await signer.sendTransaction(transaction);
  const receipt = await tx.wait();
  return receipt;
}
```

**MCP NOT NEEDED** - Standard ethers.js + Hyperliquid SDK is sufficient

---

## Complete Implementation Plan

### Phase 1: Data Layer (1 hour)
- [x] Octav API integration (we have this!)
- [ ] Hyperliquid API integration
- [ ] Portfolio data extraction
- [ ] Market data fetching

### Phase 2: AI Agents (2 hours)
- [ ] Strategy AI (Claude prompt design)
- [ ] Review AI (validation logic)
- [ ] Multi-agent communication

### Phase 3: Execution Engine (2 hours)
- [ ] Hyperliquid SDK setup
- [ ] Order placement logic
- [ ] Order monitoring
- [ ] Rebalancing engine

### Phase 4: UI (1.5 hours)
- [ ] Dashboard layout
- [ ] Strategy configuration
- [ ] Live activity feed
- [ ] Performance metrics

### Phase 5: Integration & Testing (1 hour)
- [ ] Connect all components
- [ ] Test with your wallet
- [ ] Error handling
- [ ] Deploy

**Total: 7.5 hours** (MVP)

---

## Technology Stack Summary

```
Frontend:
├─ Next.js (React)
├─ Tailwind CSS
├─ Recharts (minimal charts)
└─ ethers.js (wallet connection)

Backend:
├─ Next.js API routes
├─ Node.js worker (continuous monitoring)
├─ PostgreSQL (order logs, performance)
└─ Redis (real-time state)

AI:
├─ Claude API (Strategy + Review agents)
└─ Multi-agent architecture

Blockchain:
├─ ethers.js (Arbitrum transactions)
├─ Hyperliquid SDK (order execution)
└─ WalletConnect (wallet auth)

Data:
├─ Octav API (portfolio data)
└─ Hyperliquid API (market data, orders)

Deployment:
└─ Vercel (frontend + API routes)
```

---

## Why This Wins

### ✅ Hackathon Requirements:
1. **Octav API** - Portfolio data drives ALL decisions
2. **Authenticated calls** - Every portfolio check
3. **Live demo** - Real trading on Hyperliquid
4. **Data processing** - Grid calculations, risk analysis
5. **Documentation** - This doc + README
6. **Timeframe** - 7.5 hours for MVP
7. **BONUS - AI + Autonomous Actions** - Multi-agent system executing real trades!

### 🏆 Innovation:
- Multi-agent AI system (Strategy + Review)
- Actual autonomous trading (not just alerts)
- Grid trading strategy (proven, sophisticated)
- Portfolio-aware execution
- Hyperliquid integration (cutting-edge DEX)

### 💰 Real Value:
- Replaces human traders
- Trades 24/7 without emotion
- Exploits volatility for profit
- Institutional-grade execution
- Scalable to any portfolio size

---

## READY TO BUILD THIS?

This is:
- ✅ Exactly what Octav wants (autonomous DeFi actions)
- ✅ Technically impressive (multi-agent AI + trading)
- ✅ Actually useful (generates real profits)
- ✅ Doable in timeframe (7.5 hours)
- ✅ Uses YOUR strategy (grid trading you already like!)

**Should we start building NOW?** 🚀
