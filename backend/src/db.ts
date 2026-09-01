import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const COMPLAINT_CATEGORIES = [
  "bug",
  "feature_request",
  "other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface Complaint {
  id: number;
  name: string;
  email: string;
  category: ComplaintCategory;
  message: string;
  created_at: string;
}

export interface ComplaintInput {
  name: string;
  email: string;
  category: ComplaintCategory;
  message: string;
}

let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.DB_PATH ?? "data/complaints.db";
}

export function initDb(databasePath = getDbPath()): Database.Database {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db = database;
  return database;
}

export function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }

  return db;
}

export function insertComplaint(input: ComplaintInput): Complaint {
  const database = getDb();
  const statement = database.prepare(`
    INSERT INTO complaints (name, email, category, message)
    VALUES (@name, @email, @category, @message)
    RETURNING id, name, email, category, message, created_at
  `);

  return statement.get(input) as Complaint;
}

export function listComplaints(): Complaint[] {
  const database = getDb();
  const statement = database.prepare(`
    SELECT id, name, email, category, message, created_at
    FROM complaints
    ORDER BY created_at DESC, id DESC
  `);

  return statement.all() as Complaint[];
}

export function resetDbForTests(databasePath: string): void {
  if (db) {
    db.close();
    db = null;
  }

  initDb(databasePath);
  getDb().exec("DELETE FROM complaints");
}
