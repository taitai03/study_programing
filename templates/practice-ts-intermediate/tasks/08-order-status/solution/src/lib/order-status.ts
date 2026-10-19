import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { members, type Order, type OrderStatus, orders } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "./orders";

/** いまのステータスから、次に進めるステータス（業務仕様 3.2） */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export function nextStatuses(status: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[status];
}

export type ChangeStatusResult = { ok: true; order: Order } | { ok: false; error: string };

/**
 * 注文のステータスを変える。決められた順番以外の変更はエラーにする。
 * キャンセルしたら、注文で付与したポイントを会員から取り消す（残高はマイナスにしない）
 */
export function changeOrderStatus(db: Db, orderId: number, next: OrderStatus): ChangeStatusResult {
  return db.transaction((tx) => {
    const order = tx.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order) return { ok: false, error: "注文が見つかりません" };
    if (!nextStatuses(order.status).includes(next)) {
      return {
        ok: false,
        error: `「${ORDER_STATUS_LABELS[order.status]}」から「${ORDER_STATUS_LABELS[next]}」には変更できません`,
      };
    }

    const updated = tx.update(orders).set({ status: next }).where(eq(orders.id, orderId)).returning().get();
    if (next === "cancelled") {
      const member = tx.select().from(members).where(eq(members.id, order.memberId)).get();
      if (member) {
        tx.update(members)
          .set({ points: Math.max(0, member.points - order.pointsEarned) })
          .where(eq(members.id, member.id))
          .run();
      }
    }
    return { ok: true, order: updated };
  });
}
