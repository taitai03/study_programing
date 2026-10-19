import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRanking, salesRanking } from "../src/ranking.js";

const orders = [
  { status: "completed", items: [{ productId: 1, name: "国産こしひかり 5kg", unitPrice: 2980, quantity: 2 }] },
  { status: "cancelled", items: [{ productId: 2, name: "静岡煎茶 100g", unitPrice: 1080, quantity: 9 }] },
  { status: "paid", items: [{ productId: 2, name: "静岡煎茶 100g", unitPrice: 1080, quantity: 1 }] },
];

test("商品ごとの売上を、多い順に並べる。キャンセルは含めない", () => {
  assert.deepEqual(salesRanking(orders), [
    { productId: 1, name: "国産こしひかり 5kg", sales: 5960 },
    { productId: 2, name: "静岡煎茶 100g", sales: 1080 },
  ]);
});

test("ランキングを表示用の行にする", () => {
  assert.deepEqual(formatRanking(salesRanking(orders)), [
    "1位 国産こしひかり 5kg 5,960円",
    "2位 静岡煎茶 100g 1,080円",
  ]);
});
