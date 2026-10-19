// 課題のテスト（変更しないでください）
import { eq } from "drizzle-orm";
import { members, type OrderStatus, orders } from "@/db/schema";
import { createOrder } from "@/lib/orders";
import { db, TEST_NOW } from "@/test/db";
import { changeOrderStatus, nextStatuses, ORDER_STATUS_TRANSITIONS } from "./order-status";

function newOrder(status: OrderStatus = "pending") {
  const order = createOrder(db, { memberId: 3, items: [{ productId: 1, quantity: 2 }], now: TEST_NOW });
  db.update(orders).set({ status }).where(eq(orders.id, order.id)).run();
  return order;
}

const points = () => db.select().from(members).where(eq(members.id, 3)).get()!.points;

describe("ORDER_STATUS_TRANSITIONS / nextStatuses", () => {
  it("業務仕様のとおりに、次に進めるステータスを返す", () => {
    expect(ORDER_STATUS_TRANSITIONS).toEqual({
      pending: ["paid", "cancelled"],
      paid: ["shipped", "cancelled"],
      shipped: ["completed"],
      completed: [],
      cancelled: [],
    });
    expect(nextStatuses("paid")).toEqual(["shipped", "cancelled"]);
    expect(nextStatuses("completed")).toEqual([]);
  });
});

describe("changeOrderStatus", () => {
  it("決められた順番どおりなら変更できる", () => {
    const order = newOrder("pending");
    for (const next of ["paid", "shipped", "completed"] as const) {
      const result = changeOrderStatus(db, order.id, next);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.order.status).toBe(next);
    }
    expect(db.select().from(orders).where(eq(orders.id, order.id)).get()?.status).toBe("completed");
  });

  it.each([
    ["pending", "shipped"],
    ["shipped", "cancelled"],
    ["completed", "pending"],
    ["cancelled", "paid"],
    ["paid", "paid"],
  ] as const)("%s → %s には変更できない（エラーを返し、DBは変えない）", (from, to) => {
    const order = newOrder(from);
    const result = changeOrderStatus(db, order.id, to);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toEqual(expect.any(String));
    expect(db.select().from(orders).where(eq(orders.id, order.id)).get()?.status).toBe(from);
  });

  it("キャンセルすると、注文で付与したポイントを会員から取り消す", () => {
    const before = points();
    const order = newOrder("paid");
    expect(order.pointsEarned).toBeGreaterThan(0);
    expect(points()).toBe(before + order.pointsEarned);
    expect(changeOrderStatus(db, order.id, "cancelled").ok).toBe(true);
    expect(points()).toBe(before);
  });

  it("ポイントを取り消すとき、残高はマイナスにしない", () => {
    const order = newOrder("pending");
    db.update(members).set({ points: 1 }).where(eq(members.id, 3)).run();
    changeOrderStatus(db, order.id, "cancelled");
    expect(points()).toBe(0);
  });

  it("存在しない注文はエラー", () => {
    const result = changeOrderStatus(db, 99999, "paid");
    expect(result.ok).toBe(false);
  });
});
