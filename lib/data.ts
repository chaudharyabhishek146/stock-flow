import getDb from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  cost_price: number | null;
  selling_price: number | null;
  low_stock_threshold: number | null;
};

export type OrgSettings = {
  name: string;
  default_low_stock_threshold: number;
};

// ─── Org ──────────────────────────────────────────────────────────────────────

export function getOrgSettings(orgId: number): OrgSettings {
  const db = getDb();
  return db
    .prepare('SELECT name, default_low_stock_threshold FROM organizations WHERE id = ?')
    .get(orgId) as OrgSettings;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getProducts(orgId: number): Product[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold
       FROM products WHERE organization_id = ? ORDER BY name ASC`
    )
    .all(orgId) as Product[];
}

export function getProductById(id: number, orgId: number): Product | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold
       FROM products WHERE id = ? AND organization_id = ?`
    )
    .get(id, orgId) as Product | undefined;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboardData(orgId: number) {
  const { default_low_stock_threshold: defaultThreshold } = getOrgSettings(orgId);
  const products = getProducts(orgId);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter(
    (p) => p.quantity <= (p.low_stock_threshold ?? defaultThreshold)
  );

  return { totalProducts, totalQuantity, lowStockItems, defaultThreshold };
}
