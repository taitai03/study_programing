import type { Coupon } from "@/db/schema";
import { calculateOrder } from "./pricing";

const now = new Date("2026-04-15T03:00:00Z");

function coupon(overrides: Partial<Coupon>): Coupon {
  return {
    id: 1,
    code: "TEST",
    discountType: "fixed",
    discountValue: 500,
    minAmount: 0,
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2026-12-31T00:00:00Z"),
    ...overrides,
  };
}

describe("calculateOrder", () => {
  it("一般会員: 小計に消費税を足し、5,000円未満なら送料550円", () => {
    const r = calculateOrder({ items: [{ unitPrice: 1000, quantity: 2 }], rank: "regular", now });
    expect(r).toEqual({
      subtotal: 2000,
      rankDiscount: 0,
      couponDiscount: 0,
      tax: 200,
      shippingFee: 550,
      total: 2750,
      points: 22,
    });
  });

  it("税込でちょうど5,000円なら送料無料", () => {
    const r = calculateOrder({ items: [{ unitPrice: 4546, quantity: 1 }], rank: "regular", now });
    expect(r.tax).toBe(454);
    expect(r.shippingFee).toBe(0);
    expect(r.total).toBe(5000);
  });

  it("ゴールド会員: 10%引き、ポイントは2%", () => {
    const r = calculateOrder({ items: [{ unitPrice: 3333, quantity: 3 }], rank: "gold", now });
    expect(r.subtotal).toBe(9999);
    expect(r.rankDiscount).toBe(999);
    expect(r.tax).toBe(900);
    expect(r.total).toBe(9900);
    expect(r.points).toBe(198);
  });

  it("クーポンはランク割引のあとの金額に適用し、最低購入金額もランク割引のあとで判定する", () => {
    const r = calculateOrder({
      items: [{ unitPrice: 3000, quantity: 1 }],
      rank: "silver",
      coupon: coupon({ discountType: "percent", discountValue: 10, minAmount: 2850 }),
      now,
    });
    expect(r.rankDiscount).toBe(150);
    expect(r.couponDiscount).toBe(285);
    expect(r.tax).toBe(256);
    expect(r.total).toBe(2565 + 256 + 550);
  });

  it("最低購入金額に届かないクーポンはエラー", () => {
    expect(() =>
      calculateOrder({
        items: [{ unitPrice: 3000, quantity: 1 }],
        rank: "silver",
        coupon: coupon({ minAmount: 3000 }),
        now,
      }),
    ).toThrow("3,000円以上");
  });
});
