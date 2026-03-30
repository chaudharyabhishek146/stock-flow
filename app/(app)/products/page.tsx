import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProducts, getOrgSettings } from '@/lib/data';
import DeleteButton from './DeleteButton';
import AdjustStockForm from './AdjustStockForm';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { q } = await searchParams;
  const products = getProducts(session.orgId);
  const { default_low_stock_threshold: defaultThreshold } = getOrgSettings(session.orgId);

  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase())
      )
    : products;

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
      <form method="GET" className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU…"
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            {q ? `No products match "${q}".` : 'No products yet. Add your first product.'}
          </div>
        ) : (
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
              {filtered.map((p) => {
                const threshold = p.low_stock_threshold ?? defaultThreshold;
                const isLow = p.quantity <= threshold;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{p.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {p.selling_price != null ? `$${p.selling_price.toFixed(2)}` : '—'}
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
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </Link>
                        <DeleteButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
