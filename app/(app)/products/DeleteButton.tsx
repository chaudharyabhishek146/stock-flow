'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    setPending(true);

    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
    >
      {pending ? '…' : 'Delete'}
    </button>
  );
}
