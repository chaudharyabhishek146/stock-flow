'use client';

import { useActionState } from 'react';
import Link from 'next/link';

type ActionResult = { error: string } | void;
type Action = (_prevState: ActionResult, formData: FormData) => Promise<ActionResult>;

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  cost_price: number | null;
  selling_price: number | null;
  low_stock_threshold: number | null;
};

export default function ProductForm({
  action,
  product,
  title,
}: {
  action: Action;
  product?: Product;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={formAction} className="space-y-5">
          {product && <input type="hidden" name="id" value={product.id} />}

          {state?.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={product?.name}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Blue T-Shirt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                name="sku"
                type="text"
                required
                defaultValue={product?.sku}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. BTS-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity on hand <span className="text-red-500">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="0"
                required
                defaultValue={product?.quantity ?? 0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.cost_price ?? ''}
                  className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.selling_price ?? ''}
                  className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low stock threshold
              </label>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                defaultValue={product?.low_stock_threshold ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Uses global default"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={product?.description ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                placeholder="Optional notes about this product"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? 'Saving…' : 'Save product'}
            </button>
            <Link
              href="/products"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
