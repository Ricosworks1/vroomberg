// Server-side API route for fetching portfolio data from Octav
// This keeps the OCTAV_API_KEY secure and never exposed to the frontend

import { NextRequest, NextResponse } from 'next/server';

const OCTAV_API_URL = process.env.NEXT_PUBLIC_OCTAV_API_URL || 'https://api.octav.fi';
const OCTAV_API_KEY = process.env.OCTAV_API_KEY?.trim();

interface PortfolioToken {
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_usd: number;
  price_usd: number;
  chain: string;
  protocol?: string;
}

interface PortfolioResponse {
  wallet_address: string;
  total_balance_usd: number;
  tokens: PortfolioToken[];
  chains: string[];
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key exists
    if (!OCTAV_API_KEY) {
      console.error('OCTAV_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: API key missing' },
        { status: 500 }
      );
    }

    // Extract wallet address from query parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    console.log(`Fetching portfolio for wallet: ${walletAddress}`);

    // Call Octav API with server-side API key
    // Note: Octav API expects 'addresses' (plural) parameter
    const response = await fetch(
      `${OCTAV_API_URL}/v1/portfolio?addresses=${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OCTAV_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Octav API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API credentials' },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch portfolio data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform and return clean data to frontend
    const portfolioData: PortfolioResponse = {
      wallet_address: walletAddress,
      total_balance_usd: data.total_balance_usd || 0,
      tokens: data.tokens || [],
      chains: data.chains || [],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(portfolioData, { status: 200 });

  } catch (error: any) {
    console.error('Portfolio API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add credits check endpoint
export async function POST(request: NextRequest) {
  try {
    if (!OCTAV_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check remaining API credits
    const response = await fetch(`${OCTAV_API_URL}/v1/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OCTAV_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Credits API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
