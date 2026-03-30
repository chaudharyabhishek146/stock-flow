import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const { adjustment } = await req.json();
  const delta = parseInt(adjustment, 10);

  if (isNaN(delta) || delta === 0) {
    return Response.json({ error: 'Enter a non-zero adjustment value.' }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT id, quantity FROM products WHERE id = ? AND organization_id = ?',
    args: [parseInt(id, 10), session.orgId],
  });

  if (result.rows.length === 0) return Response.json({ error: 'Product not found.' }, { status: 404 });

  const row = result.rows[0] as unknown as { id: number; quantity: number };
  const newQty = Number(row.quantity) + delta;

  if (newQty < 0) {
    return Response.json({ error: 'Quantity cannot go below zero.' }, { status: 400 });
  }

  await db.execute({
    sql: `UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?`,
    args: [newQty, Number(row.id), session.orgId],
  });

  return Response.json({ success: true, quantity: newQty });
}
