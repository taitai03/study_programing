import type { PricingResult } from "./pricing";

/**
 * 注文に保存する金額を決める。
 * 2026/02 CS-1024 対応: クーポンを使った注文で「合計がクーポンの分だけ高い」と問い合わせがあったため、
 * 合計からクーポン割引を引くようにした
 */
export function finalizeTotals(pricing: PricingResult): PricingResult {
  if (pricing.couponDiscount === 0) return pricing;
  return { ...pricing, total: pricing.total - pricing.couponDiscount };
}
