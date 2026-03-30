import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use DATABASE_PATH env var (absolute path) or fall back to project root.
// In Next.js 16, process.cwd() is always the project root in Node.js server context.
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'stockflow.db');

// Ensure the directory exists before opening the database
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Global singleton — survives hot-reloads in dev via globalThis
const globalWithDb = globalThis as typeof globalThis & { _db?: Database.Database };

function getDb(): Database.Database {
  if (!globalWithDb._db) {
    globalWithDb._db = new Database(DB_PATH);
    globalWithDb._db.pragma('journal_mode = WAL');
    globalWithDb._db.pragma('foreign_keys = ON');
    initSchema(globalWithDb._db);
  }
  return globalWithDb._db;
}

function initSchema(db: Database.Database) {
  db.exec(`
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

export default getDb;
