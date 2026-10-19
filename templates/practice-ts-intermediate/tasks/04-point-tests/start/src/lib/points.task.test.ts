// 課題のテスト（変更しないでください）。ポイント計算の不具合が直っていることを確かめる
import { calculatePoints } from "./points";

describe("calculatePoints（不具合の修正の確認）", () => {
  it("端数は切り捨てる", () => {
    expect(calculatePoints(1250, "regular")).toBe(12);
    expect(calculatePoints(1299, "silver")).toBe(12);
    expect(calculatePoints(1275, "gold")).toBe(25);
  });
});
