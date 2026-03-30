'use client';

import { deleteProduct } from '@/app/actions/products';

export default function DeleteButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    await deleteProduct(productId);
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-500 hover:text-red-700 font-medium transition-colors"
    >
      Delete
    </button>
  );
}
