import type { Coupon } from "@/db/schema";

export class CouponError extends Error {}

/** クーポンが使えるか。使えない場合は理由を返す */
export function checkCoupon(
  coupon: Pick<Coupon, "minAmount" | "startsAt" | "endsAt">,
  amount: number,
  now: Date,
): { ok: true } | { ok: false; reason: string } {
  if (now < coupon.startsAt) return { ok: false, reason: "クーポンの利用期間前です" };
  if (now > coupon.endsAt) return { ok: false, reason: "クーポンの利用期間が終わっています" };
  if (amount < coupon.minAmount) {
    return {
      ok: false,
      reason: `クーポンは${coupon.minAmount.toLocaleString("ja-JP")}円以上の購入で使えます`,
    };
  }
  return { ok: true };
}

/**
 * クーポンの割引額を返す。amount はランク割引のあとの金額（税抜）。
 * 使えないクーポンなら CouponError を投げる
 */
export function applyCoupon(coupon: Coupon, amount: number, now: Date) {
  const check = checkCoupon(coupon, amount, now);
  if (!check.ok) throw new CouponError(check.reason);

  const discount =
    coupon.discountType === "fixed"
      ? coupon.discountValue
      : Math.floor((amount * coupon.discountValue) / 100);
  // 割引で金額がマイナスにならないようにする
  return Math.min(discount, amount);
}
