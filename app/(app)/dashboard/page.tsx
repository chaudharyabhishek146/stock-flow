import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number | null;
};

type OrgSettings = {
  default_low_stock_threshold: number;
};

async function getDashboardData(orgId: number) {
  const db = getDb();

  const settings = db
    .prepare('SELECT default_low_stock_threshold FROM organizations WHERE id = ?')
    .get(orgId) as OrgSettings;

  const defaultThreshold = settings.default_low_stock_threshold;

  const products = db
    .prepare('SELECT id, name, sku, quantity, low_stock_threshold FROM products WHERE organization_id = ?')
    .all(orgId) as Product[];

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  const lowStockItems = products.filter((p) => {
    const threshold = p.low_stock_threshold ?? defaultThreshold;
    return p.quantity <= threshold;
  });

  return { totalProducts, totalQuantity, lowStockItems, defaultThreshold };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { totalProducts, totalQuantity, lowStockItems, defaultThreshold } =
    await getDashboardData(session.orgId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Products" value={totalProducts} />
        <StatCard label="Total Units in Stock" value={totalQuantity} />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockItems.length}
          highlight={lowStockItems.length > 0}
        />
      </div>

      {/* Low stock table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Low Stock Items</h2>
          {lowStockItems.length > 0 && (
            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {lowStockItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No low stock items. All products are above threshold.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">SKU</th>
                <th className="px-5 py-3 text-right font-medium">Qty on Hand</th>
                <th className="px-5 py-3 text-right font-medium">Threshold</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStockItems.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-semibold text-red-600">{p.quantity}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {p.low_stock_threshold ?? defaultThreshold}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalProducts === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">No products yet. Add your first product to get started.</p>
          <Link
            href="/products/new"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Add product
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${highlight ? 'border-red-200' : 'border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
