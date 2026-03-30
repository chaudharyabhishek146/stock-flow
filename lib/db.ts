import { createClient, type Client } from '@libsql/client';

const globalWithDb = globalThis as typeof globalThis & {
  _client?: Client;
  _schemaReady?: boolean;
};

function getClient(): Client {
  if (!globalWithDb._client) {
    const url =
      process.env.TURSO_DATABASE_URL ??
      `file:${process.env.DATABASE_PATH ?? './stockflow.db'}`;

    globalWithDb._client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return globalWithDb._client;
}

async function initSchema(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      default_low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      cost_price REAL,
      selling_price REAL,
      low_stock_threshold INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(organization_id, sku)
    );
  `);
}

export async function getDb(): Promise<Client> {
  const client = getClient();
  if (!globalWithDb._schemaReady) {
    await initSchema(client);
    globalWithDb._schemaReady = true;
  }
  return client;
}
