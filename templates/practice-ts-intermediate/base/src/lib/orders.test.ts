import { eq } from "drizzle-orm";
import { members, orderItems, products } from "@/db/schema";
import { db, TEST_NOW } from "@/test/db";
import { createOrder, OrderError } from "./orders";

describe("createOrder", () => {
  it("注文を作り、注文時点の単価で明細を保存し、ポイントを会員に足す", () => {
    const member = db.select().from(members).where(eq(members.id, 1)).get()!;
    const product = db.select().from(products).where(eq(products.id, 1)).get()!;

    const order = createOrder(db, {
      memberId: 1,
      items: [{ productId: 1, quantity: 2 }],
      now: TEST_NOW,
    });

    expect(order.status).toBe("pending");
    expect(order.subtotal).toBe(product.price * 2);
    const items = db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all();
    expect(items).toMatchObject([{ productId: 1, quantity: 2, unitPrice: product.price }]);
    const after = db.select().from(members).where(eq(members.id, 1)).get()!;
    expect(after.points).toBe(member.points + order.pointsEarned);
  });

  it("非公開の商品や存在しない商品は注文できない", () => {
    db.update(products).set({ isPublished: false }).where(eq(products.id, 2)).run();
    expect(() => createOrder(db, { memberId: 1, items: [{ productId: 2, quantity: 1 }] })).toThrow(
      OrderError,
    );
    expect(() => createOrder(db, { memberId: 1, items: [{ productId: 999, quantity: 1 }] })).toThrow(
      "購入できない商品",
    );
  });

  it("存在しないクーポンや、条件を満たさないクーポンは使えない", () => {
    expect(() =>
      createOrder(db, { memberId: 1, items: [{ productId: 1, quantity: 1 }], couponCode: "NOPE" }),
    ).toThrow("クーポンが見つかりません");
    expect(() =>
      createOrder(db, {
        memberId: 1,
        items: [{ productId: 29, quantity: 1 }],
        couponCode: "GIFT1000",
        now: TEST_NOW,
      }),
    ).toThrow("8,000円以上");
  });
});
