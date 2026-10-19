// 商品の売上ランキング（店長会議の資料用）

/**
 * 注文の明細から、商品ごとの売上（単価 × 数量 の合計）を出し、売上の多い順に並べる。
 * キャンセルの注文は含めない
 * @param {{ status: string, items: { productId: number, name: string, unitPrice: number, quantity: number }[] }[]} orders
 * @returns {{ productId: number, name: string, sales: number }[]}
 */
export function salesRanking(orders) {
  const byProduct = new Map();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const row = byProduct.get(item.productId) ?? { productId: item.productId, name: item.name, sales: 0 };
      row.sales += item.unitPrice * item.quantity;
      byProduct.set(item.productId, row);
    }
  }
  return [...byProduct.values()].sort((a, b) => b.sales - a.sales || a.productId - b.productId);
}

/**
 * ランキングを「1位 国産こしひかり 5kg 12,000円」の形の行にする
 * @param {{ name: string, sales: number }[]} ranking
 * @returns {string[]}
 */
export function formatRanking(ranking) {
  return ranking.map((row, i) => `${i + 1}位 ${row.name} ${row.sales.toLocaleString("ja-JP")}円`);
}
