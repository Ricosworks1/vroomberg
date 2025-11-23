// Strategy AI Agent - Generates grid trading strategies using Claude
// Server-side only - ANTHROPIC_API_KEY never exposed to frontend

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface PortfolioToken {
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_usd: number;
  price_usd: number;
  chain: string;
}

interface StrategyRequest {
  wallet_address: string;
  total_balance_usd: number;
  tokens: PortfolioToken[];
  market_condition?: 'bull' | 'bear' | 'neutral';
  preferred_token?: string;
}

interface GridOrder {
  type: 'buy' | 'sell';
  price: number;
  amount_usd: number;
  trigger_condition: string;
}

interface TradingStrategy {
  strategy_type: string;
  market_analysis: string;
  recommended_token: string;
  grid_orders: GridOrder[];
  risk_level: 'low' | 'medium' | 'high';
  expected_return: string;
  rationale: string;
  warnings: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Use project-specific API key to avoid conflicts with system ANTHROPIC_API_KEY
    const apiKey = process.env.VROOMBERG_ANTHROPIC_API_KEY;

    // Validate API key exists
    if (!apiKey) {
      console.error('VROOMBERG_ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Claude API key missing' },
        { status: 500 }
      );
    }

    // Debug: Log key format (first/last 10 chars only for security)
    console.log(`API Key loaded: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)} (length: ${apiKey.length})`);

    // Initialize Anthropic client with fresh API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const body: StrategyRequest = await request.json();

    if (!body.wallet_address || !body.tokens) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_address and tokens' },
        { status: 400 }
      );
    }

    console.log(`Generating strategy for wallet: ${body.wallet_address}`);

    // Create portfolio summary for Claude
    const portfolioSummary = body.tokens
      .map(
        (t) =>
          `- ${t.token_symbol} (${t.token_name}): ${t.balance} tokens @ $${t.price_usd} = $${t.balance_usd.toFixed(2)}`
      )
      .join('\n');

    // Strategy generation prompt
    const tokenInstruction = body.preferred_token
      ? `IMPORTANT: You MUST use ${body.preferred_token} for this strategy. The user specifically requested this token.`
      : 'Choose ONE token from the portfolio for this strategy based on liquidity and volatility.';

    const prompt = `You are an expert DeFi trading strategist specializing in grid trading strategies for institutional investors.

PORTFOLIO ANALYSIS:
Wallet: ${body.wallet_address}
Total Balance: $${body.total_balance_usd.toFixed(2)}
Market Condition: ${body.market_condition || 'neutral'}

Current Holdings:
${portfolioSummary}

TASK:
Generate a grid trading strategy with the following requirements:

1. STRATEGY TYPE: Grid Trading
   - In BEAR markets: Create cascading BUY orders (accumulate on dips)
   - In BULL markets: Create cascading SELL orders (take profits on rises)
   - In NEUTRAL markets: Create both buy and sell grids

2. GRID ORDERS: Generate 5-7 specific price levels
   - Each order should have: type (buy/sell), price, amount in USD, trigger condition
   - Orders should be spaced 2-5% apart
   - Total allocation should not exceed 30% of portfolio

3. RISK ASSESSMENT:
   - Classify as low/medium/high risk
   - Provide expected return percentage
   - List specific warnings and risks

4. TOKEN SELECTION:
   - ${tokenInstruction}
   - Explain why this token is suitable for grid trading
   - Consider liquidity and volatility

IMPORTANT:
- Be conservative and realistic
- Focus on capital preservation
- Use institutional-grade risk management
- Grid orders should be executable on Hyperliquid DEX
- All prices in USD

Respond in valid JSON format with this structure:
{
  "strategy_type": "Grid Trading - Bear/Bull/Neutral",
  "market_analysis": "Brief market analysis (2-3 sentences)",
  "recommended_token": "TOKEN_SYMBOL",
  "grid_orders": [
    {
      "type": "buy" or "sell",
      "price": 0.00,
      "amount_usd": 0.00,
      "trigger_condition": "When price reaches X"
    }
  ],
  "risk_level": "low" or "medium" or "high",
  "expected_return": "X-Y%",
  "rationale": "Why this strategy works (2-3 sentences)",
  "warnings": ["Warning 1", "Warning 2"]
}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let strategy: TradingStrategy;
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      strategy = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw_response: responseText },
        { status: 500 }
      );
    }

    // Add metadata
    const response = {
      ...strategy,
      generated_at: new Date().toISOString(),
      model: 'claude-3-haiku-20240307',
      wallet_address: body.wallet_address,
    };

    console.log('Strategy generated successfully:', response.strategy_type);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Strategy generation error:', error);

    // Handle Anthropic API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Claude API credentials' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate strategy',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
