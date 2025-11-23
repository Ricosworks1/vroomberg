// Octav API client utility

export interface OctavPortfolioData {
  data: {
    net_worth?: number;
    total_protocols?: number;
    total_assets?: number;
    chains?: string[];
    [key: string]: any;
  };
}

export interface OctavTransactionData {
  data: {
    count?: number;
    recent?: any[];
    [key: string]: any;
  };
}

export class OctavClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.octav.fi') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async makeRequest(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Octav API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPortfolio(addresses: string | string[]): Promise<OctavPortfolioData> {
    const addressParam = Array.isArray(addresses) ? addresses.join(',') : addresses;
    return this.makeRequest('/v1/portfolio', { addresses: addressParam });
  }

  async getTransactions(
    addresses: string | string[],
    limit: number = 50
  ): Promise<OctavTransactionData> {
    const addressParam = Array.isArray(addresses) ? addresses.join(',') : addresses;
    return this.makeRequest('/v1/transactions', {
      addresses: addressParam,
      limit: limit.toString(),
    });
  }

  async getCredits(): Promise<number> {
    const response = await this.makeRequest('/v1/credits');
    return parseInt(response);
  }

  async getStatus() {
    return this.makeRequest('/v1/status');
  }
}
