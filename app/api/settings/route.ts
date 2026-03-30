import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrgSettings } from '@/lib/data';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const settings = await getOrgSettings(session.orgId);
  return Response.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const { defaultLowStockThreshold } = await req.json();
  const threshold = parseInt(defaultLowStockThreshold, 10);

  if (isNaN(threshold) || threshold < 0) {
    return Response.json({ error: 'Threshold must be a non-negative number.' }, { status: 400 });
  }

  const db = await getDb();
  await db.execute({
    sql: 'UPDATE organizations SET default_low_stock_threshold = ? WHERE id = ?',
    args: [threshold, session.orgId],
  });

  return Response.json({ success: true });
}
