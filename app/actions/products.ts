'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

type ActionResult = { error: string } | void;

function parseProductForm(formData: FormData) {
  return {
    name: (formData.get('name') as string)?.trim(),
    sku: (formData.get('sku') as string)?.trim().toUpperCase(),
    description: (formData.get('description') as string)?.trim() || null,
    quantity: parseInt(formData.get('quantity') as string, 10) || 0,
    cost_price: formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : null,
    selling_price: formData.get('sellingPrice') ? parseFloat(formData.get('sellingPrice') as string) : null,
    low_stock_threshold: formData.get('lowStockThreshold') ? parseInt(formData.get('lowStockThreshold') as string, 10) : null,
  };
}

export async function createProduct(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated.' };

  const fields = parseProductForm(formData);

  if (!fields.name) return { error: 'Product name is required.' };
  if (!fields.sku) return { error: 'SKU is required.' };

  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM products WHERE organization_id = ? AND sku = ?')
    .get(session.orgId, fields.sku);
  if (existing) return { error: `SKU "${fields.sku}" already exists in your inventory.` };

  db.prepare(
    `INSERT INTO products (organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    session.orgId,
    fields.name,
    fields.sku,
    fields.description,
    fields.quantity,
    fields.cost_price,
    fields.selling_price,
    fields.low_stock_threshold
  );

  revalidatePath('/products');
  revalidatePath('/dashboard');
  redirect('/products');
}

export async function updateProduct(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated.' };

  const id = parseInt(formData.get('id') as string, 10);
  const fields = parseProductForm(formData);

  if (!fields.name) return { error: 'Product name is required.' };
  if (!fields.sku) return { error: 'SKU is required.' };

  const db = getDb();

  // Verify product belongs to this org
  const product = db
    .prepare('SELECT id FROM products WHERE id = ? AND organization_id = ?')
    .get(id, session.orgId);
  if (!product) return { error: 'Product not found.' };

  // Check SKU uniqueness (excluding self)
  const skuConflict = db
    .prepare('SELECT id FROM products WHERE organization_id = ? AND sku = ? AND id != ?')
    .get(session.orgId, fields.sku, id);
  if (skuConflict) return { error: `SKU "${fields.sku}" already exists in your inventory.` };

  db.prepare(
    `UPDATE products
     SET name = ?, sku = ?, description = ?, quantity = ?, cost_price = ?, selling_price = ?,
         low_stock_threshold = ?, updated_at = datetime('now')
     WHERE id = ? AND organization_id = ?`
  ).run(
    fields.name,
    fields.sku,
    fields.description,
    fields.quantity,
    fields.cost_price,
    fields.selling_price,
    fields.low_stock_threshold,
    id,
    session.orgId
  );

  revalidatePath('/products');
  revalidatePath('/dashboard');
  redirect('/products');
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated.' };

  const db = getDb();
  const result = db
    .prepare('DELETE FROM products WHERE id = ? AND organization_id = ?')
    .run(id, session.orgId);

  if (result.changes === 0) return { error: 'Product not found.' };

  revalidatePath('/products');
  revalidatePath('/dashboard');
}

export async function adjustStock(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated.' };

  const id = parseInt(formData.get('id') as string, 10);
  const adjustment = parseInt(formData.get('adjustment') as string, 10);

  if (isNaN(adjustment) || adjustment === 0) return { error: 'Enter a non-zero adjustment value.' };

  const db = getDb();
  const product = db
    .prepare('SELECT id, quantity FROM products WHERE id = ? AND organization_id = ?')
    .get(id, session.orgId) as { id: number; quantity: number } | undefined;

  if (!product) return { error: 'Product not found.' };

  const newQty = product.quantity + adjustment;
  if (newQty < 0) return { error: 'Quantity cannot go below zero.' };

  db.prepare(
    `UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?`
  ).run(newQty, id, session.orgId);

  revalidatePath('/products');
  revalidatePath('/dashboard');
}
