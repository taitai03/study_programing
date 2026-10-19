import { sql } from "drizzle-orm";
import { db, migrateDb } from "@/db";
import { seed } from "@/db/seed";

/** テストで使う「今」。初期データの注文などは、この日時を基準に作る */
export const TEST_NOW = new Date("2026-04-15T03:00:00Z"); // 日本時間 2026/04/15 12:00

let migrated = false;

/**
 * テスト用のDBを、毎回同じ初期データ（商品50件、会員20人、注文100件）に戻す
 */
export function resetTestDb() {
  if (!migrated) {
    migrateDb(db);
    migrated = true;
  }
  const tables = db
    .all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '__drizzle%'`,
    )
    .map((t) => t.name);
  db.run(sql`PRAGMA foreign_keys = OFF`);
  for (const name of tables) {
    db.run(sql.raw(`DELETE FROM "${name}"`));
    db.run(sql.raw(`DELETE FROM sqlite_sequence WHERE name = '${name}'`));
  }
  db.run(sql`PRAGMA foreign_keys = ON`);
  seed(db, { members: 20, orders: 100, now: TEST_NOW });
}

export { db };
