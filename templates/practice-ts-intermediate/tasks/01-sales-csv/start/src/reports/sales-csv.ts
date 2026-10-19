import type { OrderStatus } from "@/db/schema";

/**
 * 月別・商品別の売上CSV（経理向け）。仕様は TASK.md を参照
 */

/** 入力: 旧システムから出力した注文明細CSVの1行 */
export type OrderLine = {
  orderId: number;
  orderedAt: Date;
  status: OrderStatus;
  productId: number;
  productName: string;
  quantity: number;
  /** 税抜の単価 */
  unitPrice: number;
};

/** 出力: 月別・商品別の売上 */
export type MonthlySales = {
  /** 日本時間の年月。例: "2026-04" */
  month: string;
  productId: number;
  productName: string;
  quantity: number;
  /** 税抜の売上（単価 × 数量 の合計） */
  sales: number;
};

/** 注文明細CSVの文字列を読み込む */
export function parseOrderLines(csvText: string): OrderLine[] {
  throw new Error("未実装です");
}

/** 月別・商品別に集計する */
export function aggregateMonthlySales(lines: OrderLine[]): MonthlySales[] {
  throw new Error("未実装です");
}

/** 集計結果をCSVの文字列にする */
export function toCsv(rows: MonthlySales[]): string {
  throw new Error("未実装です");
}

/** 注文明細CSVから、月別・商品別の売上CSVを作る */
export function buildMonthlySalesCsv(csvText: string): string {
  return toCsv(aggregateMonthlySales(parseOrderLines(csvText)));
}
