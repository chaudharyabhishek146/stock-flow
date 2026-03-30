'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdjustStockForm({
  productId,
}: {
  productId: number;
  currentQty: number;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError('');
    setPending(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const adjustment = form.get('adjustment');

    const res = await fetch(`/api/products/${productId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustment }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to adjust stock.');
    } else {
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-end gap-1.5">
      <input
        name="adjustment"
        type="number"
        placeholder="±0"
        title={error || undefined}
        className={`w-16 rounded border px-2 py-1 text-xs text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
      >
        Apply
      </button>
    </form>
  );
}
