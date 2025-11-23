'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserProvider } from 'ethers';
import { HyperliquidRealClient, convertStrategyToOrders } from '@/lib/hyperliquid-real';

interface AutonomousSettings {
  enabled: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxAllocationPercent: number; // Max % of portfolio per trade
  maxDailyLossPercent: number; // Circuit breaker
  checkIntervalMinutes: number;
  autoExecute: boolean; // If false, requires manual confirmation
}

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
  dailyPnL: number;
  lastTradeTime: string | null;
}

export default function AutonomousEngine({
  walletAddress,
  totalBalance
}: {
  walletAddress: string;
  totalBalance: number;
}) {
  const [settings, setSettings] = useState<AutonomousSettings>({
    enabled: false,
    riskTolerance: 'conservative',
    maxAllocationPercent: 10,
    maxDailyLossPercent: 5,
    checkIntervalMinutes: 15,
    autoExecute: false,
  });

  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalPnL: 0,
    dailyPnL: 0,
    lastTradeTime: null,
  });

  const [engineStatus, setEngineStatus] = useState<'idle' | 'monitoring' | 'analyzing' | 'executing' | 'error'>('idle');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<any | null>(null);
  const [logs, setLogs] = useState<Array<{ time: Date; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add log entry
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [
      { time: new Date(), message, type },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // Check if we've exceeded daily loss limit
  const checkCircuitBreaker = (): boolean => {
    const maxLoss = (totalBalance * settings.maxDailyLossPercent) / 100;
    if (Math.abs(stats.dailyPnL) >= maxLoss && stats.dailyPnL < 0) {
      addLog(`🔴 CIRCUIT BREAKER TRIGGERED: Daily loss ($${Math.abs(stats.dailyPnL).toFixed(2)}) exceeded limit ($${maxLoss.toFixed(2)})`, 'error');
      setSettings(prev => ({ ...prev, enabled: false }));
      return false;
    }
    return true;
  };

  // Generate and analyze strategy
  const analyzeMarket = async () => {
    setEngineStatus('analyzing');
    addLog('🔍 Analyzing market conditions...', 'info');

    try {
      // First, fetch current portfolio data
      const portfolioResponse = await fetch(`/api/portfolio?address=${walletAddress}`);
      if (!portfolioResponse.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const portfolioData = await portfolioResponse.json();

      // Generate strategy with portfolio data
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          total_balance_usd: portfolioData.total_balance_usd,
          tokens: portfolioData.tokens,
          market_condition: 'neutral',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Strategy generation failed');
      }

      const strategyData = await response.json();

      // Review strategy - send flattened strategy with wallet data
      const reviewResponse = await fetch('/api/review-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...strategyData,
          wallet_address: walletAddress,
          total_balance_usd: portfolioData.total_balance_usd,
        }),
      });

      if (!reviewResponse.ok) {
        const errorData = await reviewResponse.json();
        throw new Error(errorData.error || 'Strategy review failed');
      }

      const reviewData = await reviewResponse.json();

      addLog(`📊 Strategy generated: ${strategyData.strategy_type}`, 'info');
      addLog(`🤖 Review: ${reviewData.approved ? 'APPROVED' : 'REJECTED'} (${reviewData.confidence_score}% confidence)`,
        reviewData.approved ? 'success' : 'warning');

      setCurrentStrategy({
        ...strategyData,
        review: reviewData,
      });

      // Auto-execute if enabled and approved
      if (settings.autoExecute && reviewData.approved && reviewData.confidence_score >= 70) {
        addLog('✅ Strategy approved, executing automatically...', 'success');
        await executeStrategy(strategyData);
      } else if (reviewData.approved) {
        addLog('⏸️ Strategy approved but auto-execute disabled. Awaiting manual confirmation.', 'warning');
      } else {
        addLog('❌ Strategy rejected. Waiting for next cycle.', 'warning');
      }

    } catch (error: any) {
      addLog(`❌ Analysis error: ${error.message}`, 'error');
      setEngineStatus('error');
    }
  };

  // Execute trading strategy
  const executeStrategy = async (strategy: any) => {
    setEngineStatus('executing');
    addLog('⚡ Executing trading strategy...', 'info');

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Initialize Hyperliquid client
      const hlClient = new HyperliquidRealClient();
      await hlClient.initialize(provider, signer);

      // Convert strategy to orders
      const orders = convertStrategyToOrders(
        strategy.grid_orders,
        strategy.recommended_token,
        strategy.grid_orders[0]?.price || 0
      );

      // Check allocation limit
      const totalAllocation = orders.reduce((sum, order) => sum + (order.sz * order.limit_px), 0);
      const allocationPercent = (totalAllocation / totalBalance) * 100;

      if (allocationPercent > settings.maxAllocationPercent) {
        throw new Error(`Allocation (${allocationPercent.toFixed(1)}%) exceeds limit (${settings.maxAllocationPercent}%)`);
      }

      addLog(`💰 Placing ${orders.length} orders (${allocationPercent.toFixed(1)}% of portfolio)`, 'info');

      // Place orders
      const results = await hlClient.placeGridOrders(orders);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Update stats
      setStats(prev => ({
        ...prev,
        totalTrades: prev.totalTrades + successCount,
        successfulTrades: prev.successfulTrades + successCount,
        failedTrades: prev.failedTrades + failureCount,
        lastTradeTime: new Date().toISOString(),
      }));

      if (successCount > 0) {
        addLog(`✅ Successfully placed ${successCount} orders on Hyperliquid`, 'success');
      }
      if (failureCount > 0) {
        addLog(`⚠️ Failed to place ${failureCount} orders`, 'warning');
      }

    } catch (error: any) {
      addLog(`❌ Execution error: ${error.message}`, 'error');
      setStats(prev => ({
        ...prev,
        failedTrades: prev.failedTrades + 1,
      }));
      setEngineStatus('error');
    }
  };

  // Monitoring loop
  const monitoringLoop = async () => {
    if (!settings.enabled) return;

    setLastCheck(new Date());
    setEngineStatus('monitoring');
    addLog('🔄 Starting monitoring cycle', 'info');

    // Check circuit breaker
    if (!checkCircuitBreaker()) {
      return;
    }

    // Analyze market
    await analyzeMarket();

    // Calculate next check time
    const next = new Date();
    next.setMinutes(next.getMinutes() + settings.checkIntervalMinutes);
    setNextCheck(next);

    setEngineStatus('idle');
  };

  // Start/stop engine
  useEffect(() => {
    if (settings.enabled) {
      addLog('🚀 Autonomous trading engine started', 'success');

      // Run immediately
      monitoringLoop();

      // Set up interval
      intervalRef.current = setInterval(
        monitoringLoop,
        settings.checkIntervalMinutes * 60 * 1000
      );
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        addLog('⏹️ Autonomous trading engine stopped', 'warning');
      }
      setEngineStatus('idle');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.enabled, settings.checkIntervalMinutes]);

  // Reset daily PnL at midnight
  useEffect(() => {
    const resetDaily = () => {
      setStats(prev => ({ ...prev, dailyPnL: 0 }));
      addLog('📅 Daily PnL reset', 'info');
    };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      resetDaily();
      // Set up daily interval
      setInterval(resetDaily, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl shadow-lg p-6 border-2 border-indigo-200 dark:border-indigo-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🤖 Autonomous Trading Engine
        </h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            engineStatus === 'idle' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
            engineStatus === 'monitoring' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            engineStatus === 'analyzing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            engineStatus === 'executing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {engineStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Enable Trading Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border-2 border-indigo-200 dark:border-indigo-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Enable Autonomous Trading
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {settings.enabled
                ? '✅ Engine is actively monitoring and trading'
                : '⏸️ Engine is stopped'}
            </p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
              settings.enabled
                ? 'bg-green-600 dark:bg-green-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-12' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Risk Tolerance */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Risk Tolerance
          </label>
          <select
            value={settings.riskTolerance}
            onChange={(e) => setSettings(prev => ({ ...prev, riskTolerance: e.target.value as any }))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="conservative">Conservative (Low Risk)</option>
            <option value="moderate">Moderate (Medium Risk)</option>
            <option value="aggressive">Aggressive (High Risk)</option>
          </select>
        </div>

        {/* Max Allocation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Max Allocation per Trade: {settings.maxAllocationPercent}%
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={settings.maxAllocationPercent}
            onChange={(e) => setSettings(prev => ({ ...prev, maxAllocationPercent: Number(e.target.value) }))}
            className="w-full cursor-pointer accent-blue-600"
          />
        </div>

        {/* Max Daily Loss */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Max Daily Loss (Circuit Breaker): {settings.maxDailyLossPercent}%
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={settings.maxDailyLossPercent}
            onChange={(e) => setSettings(prev => ({ ...prev, maxDailyLossPercent: Number(e.target.value) }))}
            className="w-full cursor-pointer accent-red-600"
          />
        </div>

        {/* Check Interval */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Check Interval: {settings.checkIntervalMinutes} minutes
          </label>
          <select
            value={settings.checkIntervalMinutes}
            onChange={(e) => setSettings(prev => ({ ...prev, checkIntervalMinutes: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
          </select>
        </div>
      </div>

      {/* Auto Execute Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Auto-Execute Approved Strategies</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {settings.autoExecute
                ? 'Strategies will be executed automatically if approved'
                : 'Manual confirmation required for execution'}
            </p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoExecute: !prev.autoExecute }))}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer hover:opacity-90 ${
              settings.autoExecute
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.autoExecute ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Trades</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalTrades}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalTrades > 0 ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(0) : 0}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Daily PnL</p>
          <p className={`text-2xl font-bold ${stats.dailyPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.dailyPnL >= 0 ? '+' : ''}${stats.dailyPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Next Check</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {nextCheck ? new Date(nextCheck).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Activity Log</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No activity yet. Enable the engine to start monitoring.
            </p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`text-sm p-2 rounded ${
                  log.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                  log.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                  log.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                  'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="font-mono text-xs opacity-75">
                  {log.time.toLocaleTimeString()}
                </span>
                {' - '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Current Strategy Preview */}
      {currentStrategy && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Current Strategy: {currentStrategy.strategy_type}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {currentStrategy.rationale}
          </p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Token</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{currentStrategy.recommended_token}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Orders</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{currentStrategy.grid_orders?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review</p>
              <p className={`font-semibold ${currentStrategy.review?.approved ? 'text-green-600' : 'text-red-600'}`}>
                {currentStrategy.review?.approved ? 'APPROVED' : 'REJECTED'} ({currentStrategy.review?.confidence_score}%)
              </p>
            </div>
          </div>
          {!settings.autoExecute && currentStrategy.review?.approved && (
            <button
              onClick={() => executeStrategy(currentStrategy)}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Execute Strategy Manually
            </button>
          )}
        </div>
      )}
    </div>
  );
}
