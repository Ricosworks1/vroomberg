'use client';

import { useState } from 'react';

export default function ReportRequest() {
  const [walletAddress, setWalletAddress] = useState('');
  const [reportType, setReportType] = useState<'automated' | 'expert'>('automated');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, reportType }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to generate report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="request-report" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Request Payment Flow Analysis
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              id="wallet"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setReportType('automated')}
                className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                  reportType === 'automated'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Automated Report</h3>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">$1,000</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-generated analysis delivered in 5-10 minutes
                </p>
              </div>

              <div
                onClick={() => setReportType('expert')}
                className={`cursor-pointer p-4 border-2 rounded-lg transition ${
                  reportType === 'expert'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Expert Review</h3>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">$2,000</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI draft + human expert review and refinement
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </span>
            ) : (
              `Request ${reportType === 'automated' ? 'Automated' : 'Expert-Reviewed'} Report`
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <h3 className={`font-semibold mb-2 ${result.error ? 'text-red-900 dark:text-red-300' : 'text-green-900 dark:text-green-300'}`}>
              {result.error ? 'Error' : 'Report Generated'}
            </h3>
            <p className={result.error ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}>
              {result.error || result.message || 'Your report has been generated successfully!'}
            </p>
            {result.preview && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-700 rounded">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {result.preview}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
