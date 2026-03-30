import { getDb } from '@/lib/db';

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

// Converts a libsql Row (which has methods) into a plain serialisable object
function toPlain<T>(row: unknown): T {
  return JSON.parse(JSON.stringify(row)) as T;
}

// ─── Org ──────────────────────────────────────────────────────────────────────

export async function getOrgSettings(orgId: number): Promise<OrgSettings> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT name, default_low_stock_threshold FROM organizations WHERE id = ?',
    args: [orgId],
  });
  return toPlain<OrgSettings>(result.rows[0]);
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(orgId: number): Promise<Product[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold
          FROM products WHERE organization_id = ? ORDER BY name ASC`,
    args: [orgId],
  });
  return result.rows.map((r) => toPlain<Product>(r));
}

export async function getProductById(id: number, orgId: number): Promise<Product | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold
          FROM products WHERE id = ? AND organization_id = ?`,
    args: [id, orgId],
  });
  return result.rows[0] ? toPlain<Product>(result.rows[0]) : undefined;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: number) {
  const [settings, products] = await Promise.all([
    getOrgSettings(orgId),
    getProducts(orgId),
  ]);

  const defaultThreshold = settings.default_low_stock_threshold;
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItems = products.filter(
    (p) => p.quantity <= (p.low_stock_threshold ?? defaultThreshold)
  );

  return { totalProducts, totalQuantity, lowStockItems, defaultThreshold };
}
