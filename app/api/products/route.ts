import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProducts } from '@/lib/data';
import getDb from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const products = getProducts(session.orgId);
  return Response.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();
  const { name, sku, description, quantity, costPrice, sellingPrice, lowStockThreshold } = body;

  const normalizedSku = sku?.trim().toUpperCase();
  if (!name?.trim()) return Response.json({ error: 'Product name is required.' }, { status: 400 });
  if (!normalizedSku) return Response.json({ error: 'SKU is required.' }, { status: 400 });

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM products WHERE organization_id = ? AND sku = ?')
    .get(session.orgId, normalizedSku);
  if (existing) {
    return Response.json(
      { error: `SKU "${normalizedSku}" already exists in your inventory.` },
      { status: 409 }
    );
  }

  db.prepare(
    `INSERT INTO products (organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    session.orgId,
    name.trim(),
    normalizedSku,
    description?.trim() || null,
    parseInt(quantity, 10) || 0,
    costPrice ? parseFloat(costPrice) : null,
    sellingPrice ? parseFloat(sellingPrice) : null,
    lowStockThreshold ? parseInt(lowStockThreshold, 10) : null
  );

  return Response.json({ success: true }, { status: 201 });
}
