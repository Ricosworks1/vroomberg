// Hyperliquid DEX integration for trade execution
// Handles order placement on Arbitrum via user's wallet

import { BrowserProvider, Signer } from 'ethers';

// Hyperliquid API endpoints (Arbitrum)
const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';

export interface OrderParams {
  coin: string; // Token symbol (e.g., 'ETH', 'BTC')
  is_buy: boolean;
  sz: number; // Size in tokens
  limit_px: number; // Limit price in USD
  order_type: 'limit' | 'market';
  reduce_only: boolean;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  error?: string;
  tx_hash?: string;
}

export class HyperliquidClient {
  private signer: Signer | null = null;
  private provider: BrowserProvider | null = null;

  constructor() {}

  /**
   * Initialize client with user's wallet signer
   */
  async initialize(provider: BrowserProvider, signer: Signer) {
    this.provider = provider;
    this.signer = signer;

    // Verify we're on Arbitrum
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 42161) {
      throw new Error('Hyperliquid requires Arbitrum network (Chain ID: 42161)');
    }

    return this;
  }

  /**
   * Place a limit order on Hyperliquid
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    if (!this.signer) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      // Validate parameters
      if (!params.coin || params.sz <= 0 || params.limit_px <= 0) {
        throw new Error('Invalid order parameters');
      }

      console.log('Placing limit order:', params);

      // In production, this would use the Hyperliquid SDK
      // For MVP, we simulate the order placement
      // Real implementation would look like:
      /*
      const orderRequest = {
        coin: params.coin,
        is_buy: params.is_buy,
        sz: params.sz.toString(),
        limit_px: params.limit_px.toString(),
        order_type: { limit: { tif: 'Gtc' } },
        reduce_only: params.reduce_only,
      };

      const action = {
        type: 'order',
        orders: [orderRequest],
        grouping: 'na',
      };

      // Sign the action with wallet
      const signature = await this.signAction(action);

      // Submit to Hyperliquid API
      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          signature,
          nonce: Date.now(),
        }),
      });

      const result = await response.json();
      */

      // MVP: Return simulated success
      // TODO: Replace with actual Hyperliquid SDK integration
      const simulatedOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        order_id: simulatedOrderId,
        tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
    } catch (error: any) {
      console.error('Order placement error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place order',
      };
    }
  }

  /**
   * Place multiple grid orders
   */
  async placeGridOrders(orders: OrderParams[]): Promise<OrderResult[]> {
    if (!this.signer) {
      throw new Error('Client not initialized');
    }

    const results: OrderResult[] = [];

    // Place orders sequentially (in production, could batch)
    for (const order of orders) {
      const result = await this.placeLimitOrder(order);
      results.push(result);

      // Small delay between orders to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, coin: string): Promise<OrderResult> {
    if (!this.signer) {
      throw new Error('Client not initialized');
    }

    try {
      console.log(`Canceling order ${orderId} for ${coin}`);

      // MVP: Simulated cancellation
      // TODO: Implement actual Hyperliquid cancel order API

      return {
        success: true,
        order_id: orderId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get open orders for a coin
   */
  async getOpenOrders(coin: string): Promise<any[]> {
    if (!this.signer) {
      throw new Error('Client not initialized');
    }

    try {
      const address = await this.signer.getAddress();

      // In production, fetch from Hyperliquid API
      // const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'openOrders',
      //     user: address,
      //   }),
      // });

      // MVP: Return empty array
      return [];
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  /**
   * Sign action for Hyperliquid (EIP-712)
   */
  private async signAction(action: any): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available');
    }

    // In production, this would use EIP-712 structured signing
    // For Hyperliquid's specific message format
    const message = JSON.stringify(action);
    const signature = await this.signer.signMessage(message);

    return signature;
  }
}

/**
 * Convert grid trading strategy to Hyperliquid orders
 */
export function convertStrategyToOrders(
  gridOrders: Array<{
    type: 'buy' | 'sell';
    price: number;
    amount_usd: number;
  }>,
  coin: string,
  currentPrice: number
): OrderParams[] {
  return gridOrders.map((order) => {
    // Calculate token amount from USD amount
    const tokenAmount = order.amount_usd / order.price;

    return {
      coin,
      is_buy: order.type === 'buy',
      sz: tokenAmount,
      limit_px: order.price,
      order_type: 'limit' as const,
      reduce_only: false,
    };
  });
}
