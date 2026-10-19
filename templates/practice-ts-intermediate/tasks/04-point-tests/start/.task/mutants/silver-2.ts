// バグ: シルバー会員が2%になっている
import type { MemberRank } from "@/db/schema";

/** 付与するポイントの率（%）。ゴールド会員だけ2% */
export const POINT_PERCENT: Record<MemberRank, number> = {
  regular: 1,
  silver: 2,
  gold: 2,
};

/**
 * 注文で付与するポイント。
 * taxIncluded は割引と消費税を反映した金額（送料を含まない）。端数は切り捨て
 */
export function calculatePoints(taxIncluded: number, rank: MemberRank) {
  if (taxIncluded <= 0) return 0;
  return Math.floor((taxIncluded * POINT_PERCENT[rank]) / 100);
}
