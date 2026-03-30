'use client';

import { useActionState } from 'react';
import { adjustStock } from '@/app/actions/products';

export default function AdjustStockForm({
  productId,
  currentQty,
}: {
  productId: number;
  currentQty: number;
}) {
  const [state, action, pending] = useActionState(adjustStock, undefined);

  return (
    <form action={action} className="flex items-center justify-end gap-1.5">
      <input type="hidden" name="id" value={productId} />
      <input
        name="adjustment"
        type="number"
        placeholder="±0"
        className="w-16 rounded border border-gray-300 px-2 py-1 text-xs text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        title={state?.error}
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
