// Real Hyperliquid DEX integration using @nktkas/hyperliquid SDK
// ⚠️ WARNING: This places REAL orders with REAL money on Hyperliquid mainnet

import { Hyperliquid } from '@nktkas/hyperliquid';
import { BrowserProvider, Signer } from 'ethers';

export interface OrderParams {
  asset: string; // Asset symbol (e.g., 'ETH', 'BTC')
  is_buy: boolean;
  sz: number; // Size in tokens
  limit_px: number; // Limit price in USD
  reduce_only: boolean;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  error?: string;
  status?: {
    statuses: any[];
  };
}

export class HyperliquidRealClient {
  private signer: Signer | null = null;
  private provider: BrowserProvider | null = null;
  private sdk: Hyperliquid | null = null;

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

    // Get wallet address
    const walletAddress = await signer.getAddress();

    // Initialize Hyperliquid SDK with custom signer
    this.sdk = new Hyperliquid({
      walletAddress,
      privateKey: undefined, // We'll use custom signing
      enableWs: false,
    });

    return this;
  }

  /**
   * Place a limit order on Hyperliquid
   * ⚠️ WARNING: This places a REAL order with REAL money
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    if (!this.sdk || !this.signer) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      // Validate parameters
      if (!params.asset || params.sz <= 0 || params.limit_px <= 0) {
        throw new Error('Invalid order parameters');
      }

      console.log('[HYPERLIQUID] Placing REAL limit order:', params);

      // Create order using SDK
      const orderRequest = {
        coin: params.asset,
        is_buy: params.is_buy,
        sz: params.sz,
        limit_px: params.limit_px,
        order_type: { limit: { tif: 'Gtc' } }, // Good til canceled
        reduce_only: params.reduce_only,
      };

      // The SDK handles EIP-712 signing internally
      // For browser wallet signing, we need to use the exchange's order method
      const response = await this.sdk.exchange.placeOrder(orderRequest, await this.signer.getAddress());

      console.log('[HYPERLIQUID] Order response:', response);

      if (response.status === 'ok') {
        return {
          success: true,
          order_id: response.response?.data?.statuses?.[0]?.resting?.oid,
          status: response.response?.data,
        };
      } else {
        return {
          success: false,
          error: response.response?.error || 'Order placement failed',
        };
      }
    } catch (error: any) {
      console.error('[HYPERLIQUID] Order placement error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place order',
      };
    }
  }

  /**
   * Place multiple grid orders
   * ⚠️ WARNING: This places REAL orders with REAL money
   */
  async placeGridOrders(orders: OrderParams[]): Promise<OrderResult[]> {
    if (!this.sdk || !this.signer) {
      throw new Error('Client not initialized');
    }

    const results: OrderResult[] = [];

    // Place orders sequentially to avoid rate limiting
    for (const order of orders) {
      const result = await this.placeLimitOrder(order);
      results.push(result);

      // Small delay between orders
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Get asset info (for validation)
   */
  async getAssetInfo(asset: string): Promise<any> {
    if (!this.sdk) {
      throw new Error('Client not initialized');
    }

    try {
      const meta = await this.sdk.info.meta();
      const assetInfo = meta.universe.find((u) => u.name === asset);
      return assetInfo;
    } catch (error) {
      console.error('[HYPERLIQUID] Failed to get asset info:', error);
      return null;
    }
  }

  /**
   * Get user's open orders
   */
  async getOpenOrders(): Promise<any[]> {
    if (!this.sdk || !this.signer) {
      throw new Error('Client not initialized');
    }

    try {
      const address = await this.signer.getAddress();
      const response = await this.sdk.info.openOrders(address);
      return response || [];
    } catch (error: any) {
      console.error('[HYPERLIQUID] Failed to fetch open orders:', error);
      return [];
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(coin: string, oid: number): Promise<OrderResult> {
    if (!this.sdk || !this.signer) {
      throw new Error('Client not initialized');
    }

    try {
      const response = await this.sdk.exchange.cancelOrder({
        coin,
        oid,
      }, await this.signer.getAddress());

      return {
        success: response.status === 'ok',
        error: response.status !== 'ok' ? response.response?.error : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
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
  asset: string,
  currentPrice: number
): OrderParams[] {
  return gridOrders.map((order) => {
    // Calculate token amount from USD amount
    const tokenAmount = order.amount_usd / order.price;

    return {
      asset,
      is_buy: order.type === 'buy',
      sz: parseFloat(tokenAmount.toFixed(6)), // Round to 6 decimals
      limit_px: parseFloat(order.price.toFixed(2)), // Round to 2 decimals
      reduce_only: false,
    };
  });
}
