import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  hashPassword,
  verifyPassword,
} from "./auth.js";

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

export interface User {
  id: number;
  username: string;
  password_hash: string;
}

let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.DB_PATH ?? "data/complaints.db";
}

function seedDefaultUser(database: Database.Database): void {
  const existingUser = database
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(DEFAULT_ADMIN_USERNAME);

  if (existingUser) {
    return;
  }

  database
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(DEFAULT_ADMIN_USERNAME, hashPassword(DEFAULT_ADMIN_PASSWORD));
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
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  seedDefaultUser(database);

  db = database;
  return database;
}

export function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }

  return db;
}

export function findUserByUsername(username: string): User | undefined {
  const database = getDb();
  return database
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username) as User | undefined;
}

export function verifyUserCredentials(
  username: string,
  password: string,
): User | null {
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return user;
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
  const database = getDb();
  database.exec("DELETE FROM complaints");
  database.exec("DELETE FROM users");
  database.exec("DELETE FROM sqlite_sequence WHERE name IN ('complaints', 'users')");
  seedDefaultUser(database);
}
