import { calculatePoints } from "./points";

describe("calculatePoints", () => {
  describe("正常系: 会員ランクごとの率", () => {
    it("一般・シルバーは1%", () => {
      expect(calculatePoints(10000, "regular")).toBe(100);
      expect(calculatePoints(10000, "silver")).toBe(100);
    });

    it("ゴールドは2%", () => {
      expect(calculatePoints(10000, "gold")).toBe(200);
    });
  });

  describe("境界値: 端数の扱い", () => {
    it("端数は切り捨てる（四捨五入でも切り上げでもない）", () => {
      expect(calculatePoints(1250, "regular")).toBe(12);
      expect(calculatePoints(1201, "regular")).toBe(12);
      expect(calculatePoints(1299, "regular")).toBe(12);
      expect(calculatePoints(149, "gold")).toBe(2);
    });

    it("1ポイントに満たない金額は0", () => {
      expect(calculatePoints(99, "regular")).toBe(0);
    });
  });

  describe("異常系", () => {
    it("金額が0以下なら0", () => {
      expect(calculatePoints(0, "gold")).toBe(0);
      expect(calculatePoints(-500, "regular")).toBe(0);
    });
  });
});
