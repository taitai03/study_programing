import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";

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

const COLUMNS = ["order_id", "ordered_at", "status", "product_id", "product_name", "quantity", "unit_price"];

function toInteger(value: string, line: number, column: string) {
  if (!/^-?\d+$/.test(value)) throw new Error(`${line}行目: ${column} が整数ではありません（${value}）`);
  return Number(value);
}

/** 注文明細CSVの文字列を読み込む */
export function parseOrderLines(csvText: string): OrderLine[] {
  const records: string[][] = parse(csvText, { skip_empty_lines: true, relax_column_count: true });
  const [header, ...rows] = records;
  if (header?.join(",") !== COLUMNS.join(",")) throw new Error("1行目: 見出しの行が正しくありません");

  return rows.map((row, i) => {
    const line = i + 2;
    if (row.length !== COLUMNS.length) {
      throw new Error(`${line}行目: 列の数が ${row.length} です（${COLUMNS.length} 列のはずです）`);
    }
    const [orderId, orderedAt, status, productId, productName, quantity, unitPrice] = row;
    const date = new Date(orderedAt);
    if (Number.isNaN(date.getTime())) throw new Error(`${line}行目: ordered_at が日時ではありません`);
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new Error(`${line}行目: status が正しくありません（${status}）`);
    }
    return {
      orderId: toInteger(orderId, line, "order_id"),
      orderedAt: date,
      status: status as OrderStatus,
      productId: toInteger(productId, line, "product_id"),
      productName,
      quantity: toInteger(quantity, line, "quantity"),
      unitPrice: toInteger(unitPrice, line, "unit_price"),
    };
  });
}

/** 日本時間の年月（例: "2026-04"） */
function jstMonth(date: Date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

/** 月別・商品別に集計する */
export function aggregateMonthlySales(lines: OrderLine[]): MonthlySales[] {
  const byKey = new Map<string, MonthlySales>();
  for (const line of lines.filter((l) => l.status !== "cancelled")) {
    const month = jstMonth(line.orderedAt);
    const key = `${month}:${line.productId}`;
    const row = byKey.get(key) ?? {
      month,
      productId: line.productId,
      productName: line.productName,
      quantity: 0,
      sales: 0,
    };
    row.quantity += line.quantity;
    row.sales += line.unitPrice * line.quantity;
    byKey.set(key, row);
  }
  return [...byKey.values()].sort(
    (a, b) => a.month.localeCompare(b.month) || b.sales - a.sales || a.productId - b.productId,
  );
}

/** 集計結果をCSVの文字列にする */
export function toCsv(rows: MonthlySales[]): string {
  return stringify(
    rows.map((r) => [r.month, r.productId, r.productName, r.quantity, r.sales]),
    { header: true, columns: ["month", "product_id", "product_name", "quantity", "sales"] },
  );
}

/** 注文明細CSVから、月別・商品別の売上CSVを作る */
export function buildMonthlySalesCsv(csvText: string): string {
  return toCsv(aggregateMonthlySales(parseOrderLines(csvText)));
}
