import { NextRequest } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, confirmPassword, orgName } = await req.json();

  const normalizedEmail = email?.trim().toLowerCase();
  const trimmedOrg = orgName?.trim();

  if (!normalizedEmail || !password || !trimmedOrg) {
    return Response.json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return Response.json({ error: 'Passwords do not match.' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return Response.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const insertOrg = db.prepare('INSERT INTO organizations (name) VALUES (?) RETURNING id');
  const insertUser = db.prepare(
    'INSERT INTO users (organization_id, email, password_hash) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    const org = insertOrg.get(trimmedOrg) as { id: number };
    insertUser.run(org.id, normalizedEmail, passwordHash);
  })();

  return Response.json({ success: true }, { status: 201 });
}
