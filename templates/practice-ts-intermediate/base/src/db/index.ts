import path from "node:path";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

/** SQLite のファイル（":memory:" ならメモリ上）を開く */
export function openDb(url: string): Db {
  const sqlite = new Database(url);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/** drizzle/ にあるマイグレーションを当てる */
export function migrateDb(db: Db) {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}

const globalForDb = globalThis as unknown as { db: Db | undefined };

/** アプリで使うDB。開発中のホットリロードで接続が増えないように使い回す */
export const db: Db = globalForDb.db ?? openDb(process.env.DATABASE_URL ?? "data/dev.db");
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
