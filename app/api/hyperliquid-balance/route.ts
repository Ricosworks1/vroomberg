// API route for fetching Hyperliquid exchange balances
// Shows funds deposited to Hyperliquid DEX (not in wallet)

import { NextRequest, NextResponse } from 'next/server';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log(`[HYPERLIQUID] Fetching balance for: ${address}`);

    // Get user state from Hyperliquid
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address,
      }),
    });

    if (!response.ok) {
      console.error('[HYPERLIQUID] API error:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch Hyperliquid balance' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[HYPERLIQUID] Response:', JSON.stringify(data, null, 2));

    // Extract balances
    const withdrawable = parseFloat(data.withdrawable || '0');
    const marginSummary = data.marginSummary;
    const accountValue = marginSummary ? parseFloat(marginSummary.accountValue || '0') : 0;
    const totalMarginUsed = marginSummary ? parseFloat(marginSummary.totalMarginUsed || '0') : 0;

    // Get open positions
    const positions = data.assetPositions || [];
    const activePositions = positions.filter((p: any) =>
      parseFloat(p.position?.szi || '0') !== 0
    );

    return NextResponse.json({
      success: true,
      address,
      hyperliquid_balance: {
        withdrawable_usd: withdrawable,
        account_value_usd: accountValue,
        margin_used_usd: totalMarginUsed,
        available_balance_usd: accountValue - totalMarginUsed,
        positions: activePositions.map((p: any) => ({
          coin: p.position.coin,
          size: parseFloat(p.position.szi),
          entry_price: parseFloat(p.position.entryPx || '0'),
          unrealized_pnl: parseFloat(p.position.unrealizedPnl || '0'),
          leverage: parseFloat(p.position.leverage?.value || '0'),
        })),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[HYPERLIQUID] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
