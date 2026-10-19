// 課題のテスト（変更しないでください）
import { eq, sql } from "drizzle-orm";
import { orderItems, orders, products } from "@/db/schema";
import { db } from "@/test/db";
import {
  countLowStock,
  InventoryError,
  isLowStock,
  listInventory,
  LOW_STOCK_THRESHOLD,
  receiveStock,
} from "./inventory";
import { createOrder, OrderError } from "./orders";

const stockOf = (id: number) => db.select().from(products).where(eq(products.id, id)).get()!.stock;

describe("在庫の初期データ", () => {
  it("初期データでは、各商品の在庫を300から始め、注文の数量だけ減っている", () => {
    const sold = db
      .select({ productId: orderItems.productId, quantity: sql<number>`sum(${orderItems.quantity})` })
      .from(orderItems)
      .groupBy(orderItems.productId)
      .all();
    for (const p of db.select().from(products).all()) {
      const quantity = sold.find((s) => s.productId === p.id)?.quantity ?? 0;
      expect(p.stock + quantity).toBe(300);
    }
  });
});

describe("在庫不足の判定", () => {
  it("在庫が10個以下なら在庫不足", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(10);
    expect(isLowStock(10)).toBe(true);
    expect(isLowStock(0)).toBe(true);
    expect(isLowStock(11)).toBe(false);
  });
});

describe("listInventory", () => {
  it("すべての商品を、在庫の少ない順（同じなら商品IDの小さい順）に返す", () => {
    db.update(products).set({ stock: 3 }).where(eq(products.id, 20)).run();
    db.update(products).set({ stock: 3 }).where(eq(products.id, 5)).run();
    db.update(products).set({ stock: 10 }).where(eq(products.id, 1)).run();
    const items = listInventory(db);
    expect(items).toHaveLength(50);
    expect(items.slice(0, 3)).toEqual([
      { id: 5, name: "手延べそうめん 900g", category: "食品", stock: 3, isLow: true },
      { id: 20, name: "洗濯洗剤 詰め替え 1.5kg", category: "日用品", stock: 3, isLow: true },
      { id: 1, name: "国産こしひかり 5kg", category: "食品", stock: 10, isLow: true },
    ]);
    expect(items[3].isLow).toBe(false);
  });

  it("countLowStock は在庫不足の商品の数", () => {
    db.update(products).set({ stock: 50 }).run();
    db.update(products).set({ stock: 2 }).where(eq(products.id, 7)).run();
    expect(countLowStock(db)).toBe(1);
  });
});

describe("receiveStock（入荷登録）", () => {
  it("入荷した数だけ在庫を増やし、増やしたあとの在庫数を返す", () => {
    const before = stockOf(3);
    expect(receiveStock(db, 3, 25)).toBe(before + 25);
    expect(stockOf(3)).toBe(before + 25);
  });

  it.each([0, -1, 1.5, 1001])("入荷数 %s はエラー（1〜1000の整数だけ）", (quantity) => {
    const before = stockOf(3);
    expect(() => receiveStock(db, 3, quantity)).toThrow(InventoryError);
    expect(stockOf(3)).toBe(before);
  });

  it("存在しない商品はエラー", () => {
    expect(() => receiveStock(db, 999, 1)).toThrow(InventoryError);
  });
});

describe("注文と在庫", () => {
  it("注文すると、注文した数だけ在庫が減る", () => {
    db.update(products).set({ stock: 5 }).where(eq(products.id, 1)).run();
    createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 2 }] });
    expect(stockOf(1)).toBe(3);
  });

  it("在庫が足りない商品があれば注文できない（どの商品の在庫も、注文も変えない）", () => {
    db.update(products).set({ stock: 5 }).where(eq(products.id, 1)).run();
    db.update(products).set({ stock: 1 }).where(eq(products.id, 2)).run();
    const ordersBefore = db.select().from(orders).all().length;

    expect(() =>
      createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 2 }] }),
    ).toThrow(OrderError);
    expect(() =>
      createOrder(db, { memberId: 1, items: [{ productId: 2, quantity: 2 }] }),
    ).toThrow("在庫が足りません");

    expect(stockOf(1)).toBe(5);
    expect(stockOf(2)).toBe(1);
    expect(db.select().from(orders).all()).toHaveLength(ordersBefore);
  });

  it("在庫とちょうど同じ数なら注文できる", () => {
    db.update(products).set({ stock: 2 }).where(eq(products.id, 1)).run();
    createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 2 }] });
    expect(stockOf(1)).toBe(0);
  });
});
