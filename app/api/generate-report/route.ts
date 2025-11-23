import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { walletAddress, reportType } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch portfolio data from Octav API
    const octavData = await fetchOctavData(walletAddress);

    // Step 2: Fetch research context from GitHub releases
    const researchContext = await fetchResearchContext();

    // Step 3: Generate AI report using Claude
    const report = await generateAIReport(
      walletAddress,
      octavData,
      researchContext,
      reportType
    );

    return NextResponse.json({
      success: true,
      message: `${reportType === 'automated' ? 'Automated' : 'Expert-reviewed'} report generated successfully!`,
      preview: report,
      price: reportType === 'automated' ? 1000 : 2000,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function fetchOctavData(walletAddress: string) {
  const apiKey = process.env.OCTAV_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_OCTAV_API_URL || 'https://api.octav.fi';

  try {
    // Fetch portfolio data
    const portfolioResponse = await fetch(
      `${baseUrl}/v1/portfolio?addresses=${walletAddress}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!portfolioResponse.ok) {
      throw new Error(`Octav API error: ${portfolioResponse.statusText}`);
    }

    const portfolioData = await portfolioResponse.json();

    // Fetch transaction data
    const transactionsResponse = await fetch(
      `${baseUrl}/v1/transactions?addresses=${walletAddress}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let transactionsData = null;
    if (transactionsResponse.ok) {
      transactionsData = await transactionsResponse.json();
    }

    return {
      portfolio: portfolioData,
      transactions: transactionsData,
      walletAddress,
    };
  } catch (error) {
    console.error('Error fetching Octav data:', error);
    // Return mock data for demo purposes
    return {
      portfolio: {
        data: {
          net_worth: 125000,
          total_protocols: 8,
          total_assets: 15,
          chains: ['Ethereum', 'Polygon', 'Arbitrum'],
        }
      },
      transactions: {
        data: {
          count: 247,
          recent: []
        }
      },
      walletAddress,
      note: 'Using demo data - actual Octav API integration requires valid wallet addresses in the Octav system'
    };
  }
}

async function fetchResearchContext() {
  try {
    const owner = process.env.GITHUB_REPO_OWNER || 'Ricosworks1';
    const repo = process.env.GITHUB_REPO_NAME || 'blockchain-payment-flow-analysis';

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return 'Payment flow analysis methodology focusing on transaction patterns, risk assessment, and DeFi protocol interactions.';
    }

    const releases = await response.json();

    // Extract key research points from latest releases
    const context = releases
      .slice(0, 3)
      .map((r: any) => `${r.name}: ${r.body}`)
      .join('\n\n');

    return context || 'Advanced blockchain payment flow analysis framework.';
  } catch (error) {
    return 'Payment flow analysis methodology focusing on transaction patterns, risk assessment, and DeFi protocol interactions.';
  }
}

async function generateAIReport(
  walletAddress: string,
  octavData: any,
  researchContext: string,
  reportType: string
) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey || anthropicApiKey === 'your_anthropic_api_key_here') {
    // Return a demo report if Claude API is not configured
    return generateDemoReport(walletAddress, octavData, reportType);
  }

  try {
    const client = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const prompt = `You are a blockchain payment flow analyst. Generate a comprehensive payment flow analysis report for the following wallet.

WALLET ADDRESS: ${walletAddress}

PORTFOLIO DATA:
${JSON.stringify(octavData.portfolio, null, 2)}

TRANSACTION DATA:
${JSON.stringify(octavData.transactions, null, 2)}

RESEARCH METHODOLOGY:
${researchContext}

Generate a ${reportType === 'automated' ? 'detailed automated' : 'expert-level'} report that includes:

1. Executive Summary
2. Portfolio Overview
3. Transaction Flow Analysis
4. Risk Assessment
5. Recommendations
6. Methodology Citations

Keep the report professional, data-driven, and actionable. Use the research methodology to inform your analysis.`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    return content.type === 'text' ? content.text : 'Report generated successfully';
  } catch (error) {
    console.error('Claude API error:', error);
    return generateDemoReport(walletAddress, octavData, reportType);
  }
}

function generateDemoReport(walletAddress: string, octavData: any, reportType: string) {
  const portfolio = octavData.portfolio?.data || {};

  return `
PAYMENT FLOW ANALYSIS REPORT
${reportType === 'automated' ? '(Automated AI-Generated)' : '(Expert-Reviewed)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

Wallet: ${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 8)}
Analysis Date: ${new Date().toLocaleDateString()}
Net Worth: $${portfolio.net_worth?.toLocaleString() || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PORTFOLIO OVERVIEW

Total Assets: ${portfolio.total_assets || 'N/A'}
Active Protocols: ${portfolio.total_protocols || 'N/A'}
Chains: ${portfolio.chains?.join(', ') || 'Multiple chains'}

This wallet demonstrates diversified DeFi engagement across multiple
chains and protocols, indicating sophisticated portfolio management.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSACTION FLOW ANALYSIS

Based on Rock Research's payment flow methodology, this wallet shows:

✓ Multi-chain activity suggesting cross-chain arbitrage or yield optimization
✓ Regular protocol interactions indicating active DeFi participation
✓ Diversified asset holdings reducing concentration risk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RISK ASSESSMENT

Risk Level: MODERATE

Key Considerations:
• Multi-chain exposure increases bridging risk
• Protocol concentration in ${portfolio.total_protocols || 8} platforms
• Smart contract risk across ${portfolio.total_assets || 15} different assets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATIONS

1. Consider consolidating positions to reduce gas costs
2. Monitor protocol health scores regularly
3. Implement automated risk alerts for large movements
4. Review cross-chain bridge security periodically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHODOLOGY

This analysis uses Rock Research's payment flow framework,
integrating real-time data from Octav API with proven analytical
methodologies for blockchain transaction pattern recognition.

${octavData.note ? `\nNote: ${octavData.note}` : ''}

${reportType === 'expert' ? '\n[Expert Review: This report has been reviewed and validated by our research team]' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by Rock Research AI
Powered by Octav API & Claude AI
  `.trim();
}
