import assert from "node:assert/strict";
import { test } from "node:test";
import { calcShippingFee } from "../src/shipping.js";

test("5,000円未満は送料550円", () => {
  assert.equal(calcShippingFee(3000), 550);
});

test("5,000円を超えたら送料無料", () => {
  assert.equal(calcShippingFee(8000), 0);
});
