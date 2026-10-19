import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { coupons, members, type OrderStatus, orderItems, orders, products } from "@/db/schema";
import { CouponError } from "./coupons";
import { finalizeTotals } from "./order-totals";
import { calculateOrder } from "./pricing";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "受付",
  paid: "支払済",
  shipped: "発送済",
  completed: "完了",
  cancelled: "キャンセル",
};

/** 注文を作れなかった理由（会員向けAPIで 400 として返す） */
export class OrderError extends Error {}

export type CreateOrderInput = {
  memberId: number;
  items: { productId: number; quantity: number }[];
  couponCode?: string;
  now?: Date;
};

/**
 * 注文を作る。金額は calculateOrder で計算し、付与したポイントを会員に足す。
 * 単価は注文した時点の商品の価格を保存する
 */
export function createOrder(db: Db, { memberId, items, couponCode, now = new Date() }: CreateOrderInput) {
  if (items.length === 0) throw new OrderError("商品を1つ以上選んでください");
  if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) {
    throw new OrderError("数量は1以上の整数で指定してください");
  }

  return db.transaction((tx) => {
    const member = tx.select().from(members).where(eq(members.id, memberId)).get();
    if (!member) throw new OrderError("会員が見つかりません");

    const productIds = [...new Set(items.map((i) => i.productId))];
    const found = tx
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), eq(products.isPublished, true)))
      .all();
    const productById = new Map(found.map((p) => [p.id, p]));
    const missing = productIds.filter((id) => !productById.has(id));
    if (missing.length > 0) throw new OrderError(`購入できない商品があります（ID: ${missing.join(", ")}）`);

    const coupon = couponCode
      ? tx.select().from(coupons).where(eq(coupons.code, couponCode)).get()
      : null;
    if (couponCode && !coupon) throw new OrderError("クーポンが見つかりません");

    const lines = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: productById.get(i.productId)!.price,
    }));

    let pricing;
    try {
      pricing = finalizeTotals(calculateOrder({ items: lines, rank: member.rank, coupon, now }));
    } catch (e) {
      if (e instanceof CouponError) throw new OrderError(e.message);
      throw e;
    }

    const order = tx
      .insert(orders)
      .values({
        memberId,
        status: "pending",
        subtotal: pricing.subtotal,
        rankDiscount: pricing.rankDiscount,
        couponDiscount: pricing.couponDiscount,
        tax: pricing.tax,
        shippingFee: pricing.shippingFee,
        total: pricing.total,
        pointsEarned: pricing.points,
        couponId: coupon?.id ?? null,
        createdAt: now,
      })
      .returning()
      .get();
    tx.insert(orderItems)
      .values(lines.map((l) => ({ ...l, orderId: order.id })))
      .run();
    tx.update(members)
      .set({ points: member.points + pricing.points })
      .where(eq(members.id, memberId))
      .run();
    return order;
  });
}

/** 注文の詳細（会員、明細と商品、クーポン） */
export function getOrder(db: Db, id: number) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { member: true, coupon: true, items: { with: { product: true } } },
  });
}

/** 注文一覧（新しい順）。管理画面と、スタッフ向けの注文一覧APIで使う */
export function listOrders(db: Db, { limit = 50, offset = 0 } = {}) {
  return db.query.orders.findMany({
    with: { member: { columns: { id: true, name: true } } },
    orderBy: [desc(orders.createdAt), desc(orders.id)],
    limit,
    offset,
  });
}

/** 会員の注文履歴（新しい順） */
export function listMemberOrders(db: Db, memberId: number) {
  return db.query.orders.findMany({
    where: eq(orders.memberId, memberId),
    with: { items: { with: { product: { columns: { id: true, name: true } } } } },
    orderBy: [desc(orders.createdAt), desc(orders.id)],
  });
}

export function countOrders(db: Db) {
  return db.$count(orders);
}
