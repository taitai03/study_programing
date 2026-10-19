// 課題のテスト（変更しないでください）
import assert from "node:assert/strict";
import { test } from "node:test";
import { salesRanking } from "../../src/ranking.js";

const price = [300, 100, 500, 200, 400, 600, 150, 700, 50, 800, 250, 900];
const orders = [
  {
    status: "completed",
    items: price.map((unitPrice, i) => ({ productId: i + 1, name: `商品${i + 1}`, unitPrice, quantity: 1 })),
  },
];

test("どんな順番の注文でも、売上の多い順に並べる", () => {
  assert.deepEqual(
    salesRanking(orders).map((r) => r.sales),
    [...price].sort((a, b) => b - a),
  );
});

test("売上が同じなら、商品IDの小さい順", () => {
  const same = [
    { status: "paid", items: [{ productId: 9, name: "B", unitPrice: 100, quantity: 1 }] },
    { status: "paid", items: [{ productId: 3, name: "A", unitPrice: 100, quantity: 1 }] },
  ];
  assert.deepEqual(salesRanking(same).map((r) => r.productId), [3, 9]);
});
