import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id, 10);
  const body = await req.json();
  const { name, sku, description, quantity, costPrice, sellingPrice, lowStockThreshold } = body;

  const normalizedSku = sku?.trim().toUpperCase();
  if (!name?.trim()) return Response.json({ error: 'Product name is required.' }, { status: 400 });
  if (!normalizedSku) return Response.json({ error: 'SKU is required.' }, { status: 400 });

  const db = getDb();
  const product = db
    .prepare('SELECT id FROM products WHERE id = ? AND organization_id = ?')
    .get(productId, session.orgId);
  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });

  const skuConflict = db
    .prepare('SELECT id FROM products WHERE organization_id = ? AND sku = ? AND id != ?')
    .get(session.orgId, normalizedSku, productId);
  if (skuConflict) {
    return Response.json(
      { error: `SKU "${normalizedSku}" already exists in your inventory.` },
      { status: 409 }
    );
  }

  db.prepare(
    `UPDATE products
     SET name = ?, sku = ?, description = ?, quantity = ?, cost_price = ?, selling_price = ?,
         low_stock_threshold = ?, updated_at = datetime('now')
     WHERE id = ? AND organization_id = ?`
  ).run(
    name.trim(),
    normalizedSku,
    description?.trim() || null,
    parseInt(quantity, 10) || 0,
    costPrice ? parseFloat(costPrice) : null,
    sellingPrice ? parseFloat(sellingPrice) : null,
    lowStockThreshold ? parseInt(lowStockThreshold, 10) : null,
    productId,
    session.orgId
  );

  return Response.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const result = db
    .prepare('DELETE FROM products WHERE id = ? AND organization_id = ?')
    .run(parseInt(id, 10), session.orgId);

  if (result.changes === 0) return Response.json({ error: 'Product not found.' }, { status: 404 });
  return Response.json({ success: true });
}
