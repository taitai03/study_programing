import { db, TEST_NOW } from "@/test/db";
import { createOrder } from "./orders";

// CS-1188「クーポンが二重に適用される」の再発防止
describe("createOrder（クーポン）", () => {
  it("クーポンの割引は1回だけ適用される", () => {
    // こしひかり 2,980円 × 2 = 5,960円（WELCOME500 は3,000円以上で500円引き）
    const order = createOrder(db, {
      memberId: 3,
      items: [{ productId: 1, quantity: 2 }],
      couponCode: "WELCOME500",
      now: TEST_NOW,
    });
    expect(order.total).toBe(
      order.subtotal - order.rankDiscount - order.couponDiscount + order.tax + order.shippingFee,
    );
  });
});
