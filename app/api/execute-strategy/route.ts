// Strategy Execution Engine
// Executes approved trading strategies on Hyperliquid DEX
// Note: Actual trade signing happens client-side with user's wallet

import { NextRequest, NextResponse } from 'next/server';

interface GridOrder {
  type: 'buy' | 'sell';
  price: number;
  amount_usd: number;
  trigger_condition: string;
}

interface ExecutionRequest {
  strategy_id: string;
  wallet_address: string;
  recommended_token: string;
  grid_orders: GridOrder[];
  approved: boolean;
  confidence_score: number;
}

interface ExecutionPlan {
  execution_id: string;
  strategy_id: string;
  wallet_address: string;
  token: string;
  orders: Array<{
    order_number: number;
    type: 'buy' | 'sell';
    price: number;
    amount_usd: number;
    estimated_tokens: number;
    trigger_condition: string;
  }>;
  total_usd_required: number;
  estimated_gas_cost: number;
  execution_instructions: string[];
  ready_to_execute: boolean;
  warnings: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecutionRequest = await request.json();

    // Validate required fields
    if (!body.wallet_address || !body.grid_orders || !body.recommended_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if strategy was approved
    if (!body.approved) {
      return NextResponse.json(
        {
          error: 'Strategy not approved',
          message: 'Only approved strategies can be executed',
        },
        { status: 403 }
      );
    }

    // Check confidence score threshold
    if (body.confidence_score < 60) {
      return NextResponse.json(
        {
          error: 'Confidence score too low',
          message: `Strategy confidence (${body.confidence_score}%) is below minimum threshold (60%)`,
        },
        { status: 403 }
      );
    }

    console.log(`Preparing execution for wallet: ${body.wallet_address}`);

    // Calculate total USD required
    const totalUsdRequired = body.grid_orders.reduce(
      (sum, order) => sum + order.amount_usd,
      0
    );

    // Estimate gas costs (rough estimate for Arbitrum)
    const estimatedGasPerOrder = 0.5; // ~$0.50 per order on Arbitrum
    const estimatedGasCost = body.grid_orders.length * estimatedGasPerOrder;

    // Convert grid orders to execution format
    const executionOrders = body.grid_orders.map((order, index) => {
      const estimatedTokens = order.amount_usd / order.price;

      return {
        order_number: index + 1,
        type: order.type,
        price: order.price,
        amount_usd: order.amount_usd,
        estimated_tokens: Number(estimatedTokens.toFixed(6)),
        trigger_condition: order.trigger_condition,
      };
    });

    // Generate execution instructions
    const instructions = [
      `1. Ensure you have at least $${(totalUsdRequired + estimatedGasCost).toFixed(2)} in your wallet (${totalUsdRequired.toFixed(2)} + ${estimatedGasCost.toFixed(2)} gas)`,
      `2. Verify you are connected to Arbitrum network (Chain ID: 42161)`,
      `3. Review all ${body.grid_orders.length} grid orders before confirming`,
      `4. Each order will require a separate transaction signature`,
      `5. Orders will be placed as limit orders on Hyperliquid DEX`,
      `6. You can monitor and cancel orders from your dashboard`,
      `7. Grid orders will trigger automatically when price conditions are met`,
    ];

    // Safety warnings
    const warnings = [
      'Trading cryptocurrency carries significant risk of loss',
      'Grid trading works best in ranging markets; trending markets may cause losses',
      'Only invest what you can afford to lose',
      'Always monitor your positions and adjust as needed',
      'High volatility may trigger multiple orders rapidly',
      `This strategy allocates $${totalUsdRequired.toFixed(2)} of your portfolio`,
    ];

    // Create execution plan
    const executionPlan: ExecutionPlan = {
      execution_id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategy_id: body.strategy_id || 'unknown',
      wallet_address: body.wallet_address,
      token: body.recommended_token,
      orders: executionOrders,
      total_usd_required: totalUsdRequired,
      estimated_gas_cost: estimatedGasCost,
      execution_instructions: instructions,
      ready_to_execute: true,
      warnings,
    };

    console.log(`Execution plan created: ${executionPlan.execution_id}`);

    // Return execution plan to frontend
    // Frontend will handle actual wallet signing and order submission
    return NextResponse.json(
      {
        success: true,
        execution_plan: executionPlan,
        message: 'Execution plan created. Ready for user confirmation.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Execution planning error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create execution plan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check execution status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('execution_id');
    const walletAddress = searchParams.get('wallet');

    if (!executionId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing execution_id or wallet parameter' },
        { status: 400 }
      );
    }

    // In production, this would fetch execution status from database
    // For MVP, return mock status
    const status = {
      execution_id: executionId,
      wallet_address: walletAddress,
      status: 'pending', // pending, executing, completed, failed
      orders_placed: 0,
      orders_total: 0,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check execution status' },
      { status: 500 }
    );
  }
}
