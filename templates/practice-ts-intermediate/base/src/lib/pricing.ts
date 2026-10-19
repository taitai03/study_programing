import type { Coupon, MemberRank } from "@/db/schema";
import { applyCoupon } from "./coupons";
import { calculatePoints } from "./points";

/** 会員ランクごとの割引率（%） */
export const RANK_DISCOUNT_PERCENT: Record<MemberRank, number> = {
  regular: 0,
  silver: 5,
  gold: 10,
};

export const TAX_PERCENT = 10;
/** 送料（税込） */
export const SHIPPING_FEE = 550;
/** 税込でこの金額以上なら送料無料 */
export const FREE_SHIPPING_THRESHOLD = 5000;

export type PricingInput = {
  items: { unitPrice: number; quantity: number }[];
  rank: MemberRank;
  coupon?: Coupon | null;
  /** クーポンの有効期間の判定に使う */
  now?: Date;
};

export type PricingResult = {
  subtotal: number;
  rankDiscount: number;
  couponDiscount: number;
  tax: number;
  shippingFee: number;
  total: number;
  points: number;
};

/**
 * 注文の金額を計算する（業務仕様 3.3）。端数はすべて切り捨て。
 * 1. 小計 → 2. 会員ランク割引 → 3. クーポン割引 → 4. 消費税 → 5. 送料 → 6. 合計
 */
export function calculateOrder({ items, rank, coupon, now = new Date() }: PricingInput): PricingResult {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const rankDiscount = Math.floor((subtotal * RANK_DISCOUNT_PERCENT[rank]) / 100);
  const afterRank = subtotal - rankDiscount;

  const couponDiscount = coupon ? applyCoupon(coupon, afterRank, now) : 0;
  const discounted = afterRank - couponDiscount;

  const tax = Math.floor((discounted * TAX_PERCENT) / 100);
  const taxIncluded = discounted + tax;
  const shippingFee = taxIncluded >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : SHIPPING_FEE;

  return {
    subtotal,
    rankDiscount,
    couponDiscount,
    tax,
    shippingFee,
    total: taxIncluded + shippingFee,
    points: calculatePoints(taxIncluded, rank),
  };
}
