// 課題のテスト（変更しないでください）
import { desc } from "drizzle-orm";
import { orders } from "@/db/schema";
import { createOrder } from "@/lib/orders";
import { db } from "@/test/db";
import { GET } from "./route";

async function get(query: string) {
  const res = await GET(new Request(`http://localhost/api/orders${query}`));
  return { status: res.status, body: await res.json() };
}

/** 日本時間の日付（YYYY-MM-DD） */
const jstDate = (d: Date) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

/** テストの期待値: DBの全注文を JavaScript で絞り込んだもの（新しい順） */
function expected(filter: (o: typeof orders.$inferSelect) => boolean) {
  return db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .all()
    .filter(filter)
    .map((o) => o.id);
}

describe("GET /api/orders の絞り込み", () => {
  it("status で絞り込める", async () => {
    const { status, body } = await get("?status=paid");
    expect(status).toBe(200);
    const ids = expected((o) => o.status === "paid");
    expect(ids.length).toBeGreaterThan(0);
    expect(body.orders.map((o: { id: number }) => o.id)).toEqual(ids.slice(0, 50));
  });

  it("from と to（日本時間の日付）で、その期間（両端の日を含む）に作成された注文だけ", async () => {
    const { body } = await get("?from=2026-03-01&to=2026-03-10");
    const ids = expected((o) => jstDate(o.createdAt) >= "2026-03-01" && jstDate(o.createdAt) <= "2026-03-10");
    expect(ids.length).toBeGreaterThan(0);
    expect(body.orders.map((o: { id: number }) => o.id)).toEqual(ids);
  });

  it("日付の区切りは日本時間の0時", async () => {
    const before = createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 1 }], now: new Date("2026-05-31T14:59:59Z") });
    const after = createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 1 }], now: new Date("2026-05-31T15:00:00Z") });
    expect((await get("?from=2026-06-01")).body.orders.map((o: { id: number }) => o.id)).toEqual([after.id]);
    expect((await get("?from=2026-05-31&to=2026-05-31")).body.orders.map((o: { id: number }) => o.id)).toEqual([before.id]);
  });

  it("from だけ、to だけでも絞り込める。status とも組み合わせられる", async () => {
    const { body } = await get("?to=2026-01-31&status=completed");
    const ids = expected((o) => jstDate(o.createdAt) <= "2026-01-31" && o.status === "completed");
    expect(body.orders.map((o: { id: number }) => o.id)).toEqual(ids.slice(0, 50));
  });

  it("絞り込んだ結果も、page で次のページを取れる", async () => {
    const all = expected((o) => o.status === "completed");
    expect(all.length).toBeGreaterThan(50);
    const { body } = await get("?status=completed&page=2");
    expect(body.orders.map((o: { id: number }) => o.id)).toEqual(all.slice(50, 100));
  });

  it.each([
    ["日付の形式が違う", "?from=2026/03/01"],
    ["存在しない日付", "?to=2026-02-30"],
    ["from が to より後", "?from=2026-03-10&to=2026-03-01"],
    ["知らないステータス", "?status=refunded"],
  ])("%s: 400 で、理由をメッセージで返す", async (_, query) => {
    const { status, body } = await get(query);
    expect(status).toBe(400);
    expect(body.error).toEqual(expect.any(String));
  });
});
