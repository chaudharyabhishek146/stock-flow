import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const { adjustment } = await req.json();
  const delta = parseInt(adjustment, 10);

  if (isNaN(delta) || delta === 0) {
    return Response.json({ error: 'Enter a non-zero adjustment value.' }, { status: 400 });
  }

  const db = getDb();
  const product = db
    .prepare('SELECT id, quantity FROM products WHERE id = ? AND organization_id = ?')
    .get(parseInt(id, 10), session.orgId) as { id: number; quantity: number } | undefined;

  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });

  const newQty = product.quantity + delta;
  if (newQty < 0) {
    return Response.json({ error: 'Quantity cannot go below zero.' }, { status: 400 });
  }

  db.prepare(
    `UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?`
  ).run(newQty, product.id, session.orgId);

  return Response.json({ success: true, quantity: newQty });
}
