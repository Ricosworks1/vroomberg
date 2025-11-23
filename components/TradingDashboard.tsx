'use client';

import { useState } from 'react';

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
  risk_level: string;
  expected_return: string;
  rationale: string;
  warnings: string[];
  generated_at?: string;
}

interface ReviewResult {
  approved: boolean;
  confidence_score: number;
  risk_assessment: string;
  identified_risks: string[];
  recommendations: string[];
  approval_rationale: string;
  required_changes?: string[];
}

interface TradingDashboardProps {
  walletAddress: string;
  totalBalance: number;
  tokens: any[];
}

export default function TradingDashboard({
  walletAddress,
  totalBalance,
  tokens,
}: TradingDashboardProps) {
  const [strategy, setStrategy] = useState<TradingStrategy | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketCondition, setMarketCondition] = useState<'bull' | 'bear' | 'neutral'>('neutral');
  const [selectedToken, setSelectedToken] = useState<string>('');

  const handleGenerateStrategy = async () => {
    setGenerating(true);
    setError(null);
    setStrategy(null);
    setReview(null);

    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          total_balance_usd: totalBalance,
          tokens,
          market_condition: marketCondition,
          preferred_token: selectedToken || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate strategy');
      }

      const data = await response.json();
      setStrategy(data);

      // Automatically trigger review
      await handleReviewStrategy(data);
    } catch (err: any) {
      console.error('Strategy generation error:', err);
      setError(err.message || 'Failed to generate strategy');
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewStrategy = async (strategyToReview?: TradingStrategy) => {
    const targetStrategy = strategyToReview || strategy;
    if (!targetStrategy) return;

    setReviewing(true);
    setError(null);

    try {
      const response = await fetch('/api/review-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetStrategy,
          wallet_address: walletAddress,
          total_balance_usd: totalBalance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review strategy');
      }

      const data = await response.json();
      setReview(data);
    } catch (err: any) {
      console.error('Strategy review error:', err);
      setError(err.message || 'Failed to review strategy');
    } finally {
      setReviewing(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!strategy || !review || !review.approved) {
      setError('Strategy must be approved before execution');
      return;
    }

    try {
      const response = await fetch('/api/execute-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: `STRAT_${Date.now()}`,
          wallet_address: walletAddress,
          recommended_token: strategy.recommended_token,
          grid_orders: strategy.grid_orders,
          approved: review.approved,
          confidence_score: review.confidence_score,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Execution failed');
      }

      const data = await response.json();
      alert(
        `Execution plan created!\n\nExecution ID: ${data.execution_plan.execution_id}\n\nThis would normally trigger wallet signatures for each order. For the MVP demo, order placement is simulated.`
      );
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute strategy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Condition Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Autonomous AI Trading
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Select market condition and let the dual AI agents generate and validate a grid trading
          strategy
        </p>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setMarketCondition('bear')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              marketCondition === 'bear'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/20'
            }`}
          >
            Bear Market
            <div className="text-xs mt-1 opacity-80">Accumulation Strategy</div>
          </button>

          <button
            onClick={() => setMarketCondition('neutral')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              marketCondition === 'neutral'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
            }`}
          >
            Neutral Market
            <div className="text-xs mt-1 opacity-80">Range Trading</div>
          </button>

          <button
            onClick={() => setMarketCondition('bull')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              marketCondition === 'bull'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/20'
            }`}
          >
            Bull Market
            <div className="text-xs mt-1 opacity-80">Profit Taking</div>
          </button>
        </div>

        {/* Token Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Token (Optional - AI will choose if not specified)
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">AI Chooses Best Token</option>
            {tokens.map((token) => (
              <option key={token.token_symbol} value={token.token_symbol}>
                {token.token_symbol} - {token.token_name} (${token.balance_usd.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateStrategy}
          disabled={generating || reviewing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generating
            ? 'Generating Strategy...'
            : reviewing
            ? 'AI Reviewing Strategy...'
            : 'Generate AI Strategy'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* Strategy Display */}
      {strategy && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {strategy.strategy_type}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Token: {strategy.recommended_token} | Risk: {strategy.risk_level} | Expected
                Return: {strategy.expected_return}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                strategy.risk_level === 'low'
                  ? 'bg-green-100 text-green-800'
                  : strategy.risk_level === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {strategy.risk_level.toUpperCase()} RISK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Market Analysis
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {strategy.market_analysis}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Rationale
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{strategy.rationale}</p>
            </div>
          </div>

          {/* Grid Orders */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Grid Orders ({strategy.grid_orders.length})
            </h4>
            <div className="space-y-2">
              {strategy.grid_orders.map((order, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        order.type === 'buy'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {order.type.toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        ${order.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {order.trigger_condition}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      ${order.amount_usd.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {strategy.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                Warnings
              </h4>
              <ul className="space-y-1">
                {strategy.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-yellow-700 dark:text-yellow-400">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Review Results */}
      {review && (
        <div
          className={`rounded-xl shadow-lg p-6 ${
            review.approved
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className={`text-lg font-semibold ${
                  review.approved ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}
              >
                {review.approved ? '✓ Strategy Approved' : '✗ Strategy Rejected'}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  review.approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                Confidence Score: {review.confidence_score}%
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4
                className={`text-sm font-semibold mb-1 ${
                  review.approved ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                Risk Assessment
              </h4>
              <p
                className={`text-sm ${
                  review.approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {review.risk_assessment}
              </p>
            </div>

            <div>
              <h4
                className={`text-sm font-semibold mb-1 ${
                  review.approved ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {review.approved ? 'Approval' : 'Rejection'} Rationale
              </h4>
              <p
                className={`text-sm ${
                  review.approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {review.approval_rationale}
              </p>
            </div>

            {review.identified_risks.length > 0 && (
              <div>
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    review.approved ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  Identified Risks
                </h4>
                <ul className="space-y-1">
                  {review.identified_risks.map((risk, idx) => (
                    <li
                      key={idx}
                      className={`text-xs ${
                        review.approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      • {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.recommendations.length > 0 && (
              <div>
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    review.approved ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {review.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className={`text-xs ${
                        review.approved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {review.approved && (
            <button
              onClick={handleExecuteStrategy}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Execute Strategy on Hyperliquid
            </button>
          )}
        </div>
      )}
    </div>
  );
}
