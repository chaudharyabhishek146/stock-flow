import { NextRequest } from 'next/server';
import getDb from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, organization_id, password_hash FROM users WHERE email = ?')
    .get(normalizedEmail) as
    | { id: number; organization_id: number; password_hash: string }
    | undefined;

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  await createSession({ userId: user.id, orgId: user.organization_id, email: normalizedEmail });
  return Response.json({ success: true });
}
