import { and, gte, lt, ne } from "drizzle-orm";
import type { Db } from "@/db";
import { orders } from "@/db/schema";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 日本時間の、その日の0時（UTC の Date で返す） */
export function startOfJstDay(date: Date) {
  const jst = date.getTime() + JST_OFFSET_MS;
  return new Date(jst - (jst % DAY_MS) - JST_OFFSET_MS);
}

/** 日本時間の日付を「2026-04-01」の形にする */
export function jstDateKey(date: Date) {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * 直近 days 日間の、日ごとの売上（合計金額）と注文件数。キャンセルの注文は含めない（業務仕様 3.2）
 */
export function dailySales(db: Db, now: Date, days = 7) {
  const from = new Date(startOfJstDay(now).getTime() - (days - 1) * DAY_MS);
  const rows = db
    .select({ total: orders.total, createdAt: orders.createdAt })
    .from(orders)
    .where(and(gte(orders.createdAt, from), lt(orders.createdAt, new Date(now.getTime() + 1)), ne(orders.status, "cancelled")))
    .all();

  return Array.from({ length: days }, (_, i) => {
    const day = jstDateKey(new Date(from.getTime() + i * DAY_MS));
    const inDay = rows.filter((r) => jstDateKey(r.createdAt) === day);
    return { day, sales: inDay.reduce((s, r) => s + r.total, 0), count: inDay.length };
  });
}
