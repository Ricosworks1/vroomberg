// Review AI Agent - Validates trading strategies before execution
// Acts as a second pair of eyes to prevent bad trades
// Server-side only - ANTHROPIC_API_KEY never exposed to frontend

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface GridOrder {
  type: 'buy' | 'sell';
  price: number;
  amount_usd: number;
  trigger_condition: string;
}

interface StrategyToReview {
  strategy_type: string;
  market_analysis: string;
  recommended_token: string;
  grid_orders: GridOrder[];
  risk_level: string;
  expected_return: string;
  rationale: string;
  warnings: string[];
  wallet_address: string;
  total_balance_usd: number;
}

interface ReviewResult {
  approved: boolean;
  confidence_score: number; // 0-100
  risk_assessment: string;
  identified_risks: string[];
  recommendations: string[];
  approval_rationale: string;
  required_changes?: string[];
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
    console.log(`[REVIEW] API Key loaded: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)} (length: ${apiKey.length})`);

    // Initialize Anthropic client with fresh API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const strategy: StrategyToReview = await request.json();

    if (!strategy.grid_orders || !strategy.wallet_address) {
      return NextResponse.json(
        { error: 'Missing required strategy fields' },
        { status: 400 }
      );
    }

    console.log(`Reviewing strategy for wallet: ${strategy.wallet_address}`);

    // Calculate total allocation
    const totalAllocation = strategy.grid_orders.reduce(
      (sum, order) => sum + order.amount_usd,
      0
    );
    const allocationPercentage =
      (totalAllocation / strategy.total_balance_usd) * 100;

    // Format grid orders for review
    const gridOrdersSummary = strategy.grid_orders
      .map(
        (order, idx) =>
          `${idx + 1}. ${order.type.toUpperCase()} at $${order.price} for $${order.amount_usd} - ${order.trigger_condition}`
      )
      .join('\n');

    // Review prompt
    const prompt = `You are a senior risk management analyst at a digital asset hedge fund. Your job is to review trading strategies and approve or reject them based on institutional risk standards.

STRATEGY TO REVIEW:
========================
Type: ${strategy.strategy_type}
Token: ${strategy.recommended_token}
Risk Level: ${strategy.risk_level}
Expected Return: ${strategy.expected_return}

Market Analysis:
${strategy.market_analysis}

Rationale:
${strategy.rationale}

GRID ORDERS (Total: $${totalAllocation.toFixed(2)} / ${allocationPercentage.toFixed(1)}% of portfolio):
${gridOrdersSummary}

Strategy Warnings:
${strategy.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Portfolio Context:
- Total Balance: $${strategy.total_balance_usd.toFixed(2)}
- Allocation: ${allocationPercentage.toFixed(1)}%

YOUR TASK:
Review this strategy against institutional risk management standards:

1. RISK ASSESSMENT:
   - Is the allocation percentage reasonable? (should be ≤30% for single strategy)
   - Are grid order prices realistic and properly spaced?
   - Does the risk level match the actual risk exposure?
   - Are there hidden risks not mentioned in warnings?

2. STRATEGY VALIDATION:
   - Is the market analysis sound?
   - Are grid orders executable on a DEX?
   - Is the expected return realistic?
   - Does the rationale make sense?

3. APPROVAL DECISION:
   - APPROVE if strategy is sound and safe
   - REJECT if strategy has critical flaws or excessive risk

4. CONFIDENCE SCORE:
   - Rate 0-100 how confident you are in this strategy
   - Consider market conditions, risk exposure, and strategy logic

CRITICAL RULES:
- Auto-reject if allocation > 30% of portfolio
- Auto-reject if risk_level = "high" but allocation > 15%
- Auto-reject if grid orders have unrealistic price levels
- Auto-reject if expected return seems too optimistic (>50%)
- Be conservative - when in doubt, reject

Respond in valid JSON format:
{
  "approved": true or false,
  "confidence_score": 0-100,
  "risk_assessment": "Brief risk assessment (2-3 sentences)",
  "identified_risks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "approval_rationale": "Why approved/rejected (2-3 sentences)",
  "required_changes": ["Change 1", "Change 2"] (only if rejected)
}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more conservative review
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
    let review: ReviewResult;
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      review = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude review:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI review', raw_response: responseText },
        { status: 500 }
      );
    }

    // Add metadata
    const response = {
      ...review,
      reviewed_at: new Date().toISOString(),
      reviewer_model: 'claude-3-haiku-20240307',
      strategy_type: strategy.strategy_type,
      total_allocation_usd: totalAllocation,
      allocation_percentage: allocationPercentage,
    };

    console.log(
      `Strategy review complete: ${review.approved ? 'APPROVED' : 'REJECTED'} (${review.confidence_score}% confidence)`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Strategy review error:', error);

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
        error: 'Failed to review strategy',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
