import { asc, eq, lte } from "drizzle-orm";
import type { Db } from "@/db";
import { products } from "@/db/schema";

/** 在庫がこの数以下なら在庫不足 */
export const LOW_STOCK_THRESHOLD = 10;

/** 1回に入荷登録できる数の上限（入力ミスで桁を間違えたときに気づけるように） */
export const MAX_RECEIVE_QUANTITY = 1000;

export class InventoryError extends Error {}

export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  stock: number;
  isLow: boolean;
};

export function isLowStock(stock: number) {
  return stock <= LOW_STOCK_THRESHOLD;
}

/** すべての商品の在庫。在庫の少ない順（同じなら商品IDの小さい順） */
export function listInventory(db: Db): InventoryItem[] {
  return db.query.products
    .findMany({ with: { category: true }, orderBy: [asc(products.stock), asc(products.id)] })
    .sync()
    .map((p) => ({ id: p.id, name: p.name, category: p.category.name, stock: p.stock, isLow: isLowStock(p.stock) }));
}

export function countLowStock(db: Db) {
  return db.select({ id: products.id }).from(products).where(lte(products.stock, LOW_STOCK_THRESHOLD)).all()
    .length;
}

/** 入荷を登録する（在庫を増やす）。増やしたあとの在庫数を返す */
export function receiveStock(db: Db, productId: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_RECEIVE_QUANTITY) {
    throw new InventoryError(`入荷数は1〜${MAX_RECEIVE_QUANTITY}の整数で入力してください`);
  }
  return db.transaction((tx) => {
    const product = tx.select().from(products).where(eq(products.id, productId)).get();
    if (!product) throw new InventoryError("商品が見つかりません");
    const stock = product.stock + quantity;
    tx.update(products).set({ stock, updatedAt: new Date() }).where(eq(products.id, productId)).run();
    return stock;
  });
}
