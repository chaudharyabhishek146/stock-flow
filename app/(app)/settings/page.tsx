'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [threshold, setThreshold] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setThreshold(String(data.default_low_stock_threshold ?? 5)));
  }, []);

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setStatus('saving');
    setError('');

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultLowStockThreshold: threshold }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save settings.');
      setStatus('error');
    } else {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
              Default low stock threshold
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Products with quantity at or below this number are flagged as low stock.
              Individual products can override this value.
            </p>
            <input
              id="threshold"
              type="number"
              min="0"
              required
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="5"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'saving' ? 'Saving…' : 'Save settings'}
            </button>

            {status === 'saved' && (
              <span className="text-sm text-green-600 font-medium">✓ Saved</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
