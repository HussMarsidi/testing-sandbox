import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_VIEWER_PASSWORD,
  DEFAULT_VIEWER_USERNAME,
  hashPassword,
  verifyPassword,
} from "./auth.js";
import {
  InvalidStatusTransitionError,
  isValidStatusTransition,
  type ComplaintStatus,
} from "./status.js";

export const COMPLAINT_CATEGORIES = [
  "bug",
  "feature_request",
  "other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type UserRole = "admin" | "viewer";

export interface Complaint {
  id: number;
  name: string;
  email: string;
  category: ComplaintCategory;
  message: string;
  status: ComplaintStatus;
  created_at: string;
}

export interface ComplaintInput {
  name: string;
  email: string;
  category: ComplaintCategory;
  message: string;
}

export interface ComplaintFilters {
  status?: ComplaintStatus;
  search?: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
}

let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.DB_PATH ?? "data/complaints.db";
}

function migrateDb(database: Database.Database): void {
  const complaintColumns = database
    .prepare("PRAGMA table_info(complaints)")
    .all() as Array<{ name: string }>;

  if (!complaintColumns.some((column) => column.name === "status")) {
    database.exec(
      `ALTER TABLE complaints ADD COLUMN status TEXT NOT NULL DEFAULT 'open'`,
    );
  }

  const userColumns = database
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;

  if (!userColumns.some((column) => column.name === "role")) {
    database.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'`);
  }
}

function seedDefaultUsers(database: Database.Database): void {
  const users: Array<{ username: string; password: string; role: UserRole }> = [
    {
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
      role: "admin",
    },
    {
      username: DEFAULT_VIEWER_USERNAME,
      password: DEFAULT_VIEWER_PASSWORD,
      role: "viewer",
    },
  ];

  for (const user of users) {
    const existingUser = database
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(user.username);

    if (existingUser) {
      continue;
    }

    database
      .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)")
      .run(user.username, hashPassword(user.password), user.role);
  }
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
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );
  `);

  migrateDb(database);
  seedDefaultUsers(database);

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
    .prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?")
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
    INSERT INTO complaints (name, email, category, message, status)
    VALUES (@name, @email, @category, @message, 'open')
    RETURNING id, name, email, category, message, status, created_at
  `);

  return statement.get(input) as Complaint;
}

export function listComplaints(filters: ComplaintFilters = {}): Complaint[] {
  const database = getDb();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (filters.status) {
    conditions.push("status = @status");
    params.status = filters.status;
  }

  if (filters.search?.trim()) {
    conditions.push(
      "(name LIKE @search OR email LIKE @search OR message LIKE @search)",
    );
    params.search = `%${filters.search.trim()}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const statement = database.prepare(`
    SELECT id, name, email, category, message, status, created_at
    FROM complaints
    ${whereClause}
    ORDER BY created_at DESC, id DESC
  `);

  return statement.all(params) as Complaint[];
}

export function getComplaintById(id: number): Complaint | undefined {
  const database = getDb();
  return database
    .prepare(`
      SELECT id, name, email, category, message, status, created_at
      FROM complaints
      WHERE id = ?
    `)
    .get(id) as Complaint | undefined;
}

export function updateComplaintStatus(
  id: number,
  nextStatus: ComplaintStatus,
): Complaint | null {
  const existing = getComplaintById(id);
  if (!existing) {
    return null;
  }

  if (!isValidStatusTransition(existing.status, nextStatus)) {
    throw new InvalidStatusTransitionError(existing.status, nextStatus);
  }

  const database = getDb();
  return database
    .prepare(`
      UPDATE complaints
      SET status = @status
      WHERE id = @id
      RETURNING id, name, email, category, message, status, created_at
    `)
    .get({ id, status: nextStatus }) as Complaint;
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
  seedDefaultUsers(database);
}
