import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProducts, getOrgSettings } from '@/lib/data';
import DeleteButton from './DeleteButton';
import AdjustStockForm from './AdjustStockForm';
import SearchInput from './SearchInput';
import { Suspense } from 'react';

const PAGE_SIZE = 10;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { q, page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));

  const [products, { default_low_stock_threshold: defaultThreshold }] = await Promise.all([
    getProducts(session.orgId),
    getOrgSettings(session.orgId),
  ]);

  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase())
      )
    : products;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-2">
        <Suspense fallback={null}>
          <SearchInput />
        </Suspense>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            {q ? `No products match "${q}".` : 'No products yet. Add your first product.'}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">SKU</th>
                  <th className="px-5 py-3 text-right font-medium">Qty</th>
                  <th className="px-5 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Adjust Stock</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((p) => {
                  const threshold = p.low_stock_threshold ?? defaultThreshold;
                  const isLow = p.quantity <= threshold;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{p.quantity}</td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {p.selling_price != null ? `₹${p.selling_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isLow ? (
                          <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Low
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <AdjustStockForm productId={p.id} currentQty={p.quantity} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/products/${p.id}/edit`}
                            title="Edit product"
                            className="p-1.5 rounded text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <DeleteButton productId={p.id} productName={p.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} products
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={pageUrl(safePage - 1)}
                  aria-disabled={safePage === 1}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    safePage === 1
                      ? 'border-gray-200 text-gray-300 pointer-events-none'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ← Prev
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                      p === safePage
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                <Link
                  href={pageUrl(safePage + 1)}
                  aria-disabled={safePage === totalPages}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    safePage === totalPages
                      ? 'border-gray-200 text-gray-300 pointer-events-none'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
