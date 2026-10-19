// 課題のテスト（変更しないでください）
import assert from "node:assert/strict";
import { test } from "node:test";
import { calcShippingFee } from "../../src/shipping.js";

test("税込でちょうど5,000円なら送料無料", () => {
  assert.equal(calcShippingFee(5000), 0);
});

test("4,999円なら送料550円", () => {
  assert.equal(calcShippingFee(4999), 550);
});
