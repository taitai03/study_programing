// 課題のテスト（変更しないでください）。クーポンの割引が1回だけ適用されることを確かめる
import { eq } from "drizzle-orm";
import { coupons, members, products } from "@/db/schema";
import { db, TEST_NOW } from "@/test/db";
import { createOrder } from "./orders";
import { calculateOrder } from "./pricing";

describe("クーポンを使った注文の金額", () => {
  it.each(["WELCOME500", "SPRING10", "THANKS300"])("%s: 合計は calculateOrder の結果と同じ", (code) => {
    const member = db.select().from(members).where(eq(members.id, 1)).get()!;
    const product = db.select().from(products).where(eq(products.id, 1)).get()!;
    const coupon = db.select().from(coupons).where(eq(coupons.code, code)).get()!;

    const order = createOrder(db, {
      memberId: 1,
      items: [{ productId: 1, quantity: 2 }],
      couponCode: code,
      now: TEST_NOW,
    });
    const expected = calculateOrder({
      items: [{ unitPrice: product.price, quantity: 2 }],
      rank: member.rank,
      coupon,
      now: TEST_NOW,
    });

    expect(order.couponDiscount).toBeGreaterThan(0);
    expect(order.total).toBe(expected.total);
    expect(order.total).toBe(
      order.subtotal - order.rankDiscount - order.couponDiscount + order.tax + order.shippingFee,
    );
  });
});
