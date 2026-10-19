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

// 「ランキングの順番がおかしい」の再発防止。売上の少ない順に並んだ注文でも、多い順になること
test("並び順に関係なく、売上の多い順に並べる", () => {
  const items = [100, 500, 300].map((price, i) => ({ productId: i + 1, name: `商品${i + 1}`, unitPrice: price, quantity: 1 }));
  const ranking = salesRanking([{ status: "completed", items }]);
  assert.deepEqual(ranking.map((r) => r.sales), [500, 300, 100]);
});
