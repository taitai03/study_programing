import type { Coupon } from "@/db/schema";
import { applyCoupon, CouponError } from "./coupons";

const base: Coupon = {
  id: 1,
  code: "TEST",
  discountType: "fixed",
  discountValue: 500,
  minAmount: 1000,
  startsAt: new Date("2026-04-01T00:00:00Z"),
  endsAt: new Date("2026-04-30T00:00:00Z"),
};
const now = new Date("2026-04-15T00:00:00Z");

describe("applyCoupon", () => {
  it("定額: 割引の値をそのまま引く。金額より大きい場合は金額まで", () => {
    expect(applyCoupon(base, 1200, now)).toBe(500);
    expect(applyCoupon({ ...base, discountValue: 5000 }, 1200, now)).toBe(1200);
  });

  it("定率: 金額の割合を切り捨てで引く", () => {
    expect(applyCoupon({ ...base, discountType: "percent", discountValue: 15 }, 1999, now)).toBe(299);
  });

  it("期間外や最低購入金額未満なら CouponError", () => {
    expect(() => applyCoupon(base, 999, now)).toThrow(CouponError);
    expect(() => applyCoupon(base, 1200, new Date("2026-05-01T00:00:00Z"))).toThrow("終わっています");
    expect(() => applyCoupon(base, 1200, new Date("2026-03-31T00:00:00Z"))).toThrow("期間前");
  });
});
