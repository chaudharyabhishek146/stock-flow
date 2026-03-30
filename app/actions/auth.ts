'use server';

import { redirect } from 'next/navigation';
import getDb from '@/lib/db';
import { hashPassword, verifyPassword, createSession, deleteSession } from '@/lib/auth';

type ActionResult = { error: string } | void;

export async function signup(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const orgName = (formData.get('orgName') as string)?.trim();

  if (!email || !password || !orgName) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);

  const insertOrg = db.prepare(
    'INSERT INTO organizations (name) VALUES (?) RETURNING id'
  );
  const insertUser = db.prepare(
    'INSERT INTO users (organization_id, email, password_hash) VALUES (?, ?, ?) RETURNING id'
  );

  const txn = db.transaction(() => {
    const org = insertOrg.get(orgName) as { id: number };
    const user = insertUser.get(org.id, email, passwordHash) as { id: number };
    return { orgId: org.id, userId: user.id };
  });

  const { orgId, userId } = txn();
  await createSession({ userId, orgId, email });
  redirect('/dashboard');
}

export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, organization_id, password_hash FROM users WHERE email = ?')
    .get(email) as { id: number; organization_id: number; password_hash: string } | undefined;

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'Invalid email or password.' };
  }

  await createSession({ userId: user.id, orgId: user.organization_id, email });
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
