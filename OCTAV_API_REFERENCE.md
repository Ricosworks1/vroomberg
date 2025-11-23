# Octav API Complete Reference

## Base Configuration
- **Base URL**: `https://api.octav.fi`
- **Authentication**: Bearer token in Authorization header
- **Rate Limit**: 360 requests/minute per API key
- **Caching**: 1-minute cache for real-time data

---

## All Available Endpoints

### 1. 📊 Portfolio Endpoint
**GET** `/v1/portfolio`

**Purpose**: Retrieve complete portfolio holdings with asset breakdown by protocol and chain

**Parameters**:
- `addresses` (required): Comma-separated wallet addresses

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/portfolio?addresses=0x123..." \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: 1 credit per call

**Response Includes**:
- Net worth
- Asset breakdown by protocol
- Chain-specific holdings
- Protocol positions
- Token balances

---

### 2. 💸 Transactions Endpoint
**GET** `/v1/transactions`

**Purpose**: Get paginated transaction history with filtering and search capabilities

**Parameters**:
- `addresses` (required): Wallet address(es)
- `limit` (optional): Transactions per page (1-250, default: 50)
- `offset` (optional): Pagination offset
- `sort` (optional): Sort order (DESC/ASC, default: DESC)
- Additional filters for chains, protocols, transaction types

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/transactions?addresses=0x123...&limit=50&sort=DESC" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: 1 credit per call

**Response Includes**:
- Transaction history
- Transaction types (swap, transfer, deposit, etc.)
- Timestamps
- Amounts and tokens
- Gas fees
- Protocol interactions

---

### 3. 🪙 Token Overview Endpoint
**GET** `/v1/token-overview`

**Purpose**: Detailed token breakdown across wallet and protocol positions

**Parameters**:
- `addresses` (required): Wallet address(es)
- Additional token-specific filters

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/token-overview?addresses=0x123..." \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: 1 credit per call

**Response Includes**:
- Token balances
- Token distribution
- Protocol positions per token
- Token values
- Token allocation percentages

---

### 4. 📈 Historical Portfolio Endpoint
**GET** `/v1/historical`

**Purpose**: Retrieve historical portfolio snapshots for any date

**Parameters**:
- `addresses` (required): Wallet address(es)
- `date` or `date_range`: Specific date or range for historical data

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/historical?addresses=0x123...&date=2025-01-01" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: 1 credit per call

**Response Includes**:
- Historical net worth
- Past portfolio composition
- Historical token holdings
- Performance over time

---

### 5. 🔄 Sync Transactions Endpoint
**POST** `/v1/sync-transactions`

**Purpose**: Trigger transaction synchronization for an address

**Parameters**:
- `addresses` (required): Wallet address to sync

**Request Example**:
```bash
curl -X POST "https://api.octav.fi/v1/sync-transactions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"addresses": "0x123..."}'
```

**Cost**: 1 credit + 1 credit per 250 transactions

**Use Case**: Force refresh of transaction data for an address

---

### 6. ✅ Status Endpoint
**GET** `/v1/status`

**Purpose**: Check sync status and data freshness

**Parameters**:
- May require address parameter to check specific wallet status

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/status" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: FREE (0 credits)

**Response Includes**:
- Sync status
- Last update timestamp
- Data freshness indicators

---

### 7. 💳 Credits Endpoint
**GET** `/v1/credits`

**Purpose**: Check your remaining credit balance

**Parameters**: None

**Request Example**:
```bash
curl -X GET "https://api.octav.fi/v1/credits" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Cost**: FREE (0 credits)

**Response**: Numeric credit balance (e.g., `500`)

---

## Supported Chains (20+)

Based on Octav documentation, supported chains include:
- Ethereum (ETH)
- Polygon (MATIC)
- Arbitrum
- Optimism
- Base
- BSC (Binance Smart Chain)
- Avalanche
- Solana
- And 12+ more chains

---

## Error Handling

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `429`: Rate Limit Exceeded
- `500`: Server Error

**Best Practices**:
1. Always check response status
2. Implement retry logic for rate limits
3. Cache responses when appropriate
4. Handle errors gracefully

---

## Usage Examples for Our App

### Complete Data Collection Flow:

```typescript
// 1. Check credits
const credits = await fetch('https://api.octav.fi/v1/credits', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// 2. Get portfolio overview
const portfolio = await fetch(`https://api.octav.fi/v1/portfolio?addresses=${wallet}`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// 3. Get recent transactions
const transactions = await fetch(`https://api.octav.fi/v1/transactions?addresses=${wallet}&limit=100`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// 4. Get token breakdown
const tokens = await fetch(`https://api.octav.fi/v1/token-overview?addresses=${wallet}`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// 5. Get historical data
const historical = await fetch(`https://api.octav.fi/v1/historical?addresses=${wallet}`, {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

---

## Credit Cost Summary

| Endpoint | Cost |
|----------|------|
| Portfolio | 1 credit |
| Transactions | 1 credit |
| Token Overview | 1 credit |
| Historical | 1 credit |
| Sync Transactions | 1 + (1 per 250 txs) |
| Status | FREE |
| Credits | FREE |

**Total for complete analysis**: ~4-5 credits per wallet

---

## Next Steps for Implementation

1. ✅ Test each endpoint with real wallet addresses
2. ✅ Implement all 7 endpoints in our app
3. ✅ Create data processing functions for each endpoint
4. ✅ Build visualizations for the data
5. ✅ Combine data for comprehensive insights
