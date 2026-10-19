require "rails_helper"

RSpec.describe PointCalculator do
  describe ".points" do
    context "正常系: 会員ランクごとの率" do
      it "一般・シルバーは1%" do
        expect(described_class.points(10_000, "regular")).to eq(100)
        expect(described_class.points(10_000, "silver")).to eq(100)
      end

      it "ゴールドは2%" do
        expect(described_class.points(10_000, "gold")).to eq(200)
      end
    end

    context "境界値: 端数の扱い" do
      it "端数は切り捨てる（四捨五入でも切り上げでもない）" do
        expect(described_class.points(1250, "regular")).to eq(12)
        expect(described_class.points(1201, "regular")).to eq(12)
        expect(described_class.points(1299, "regular")).to eq(12)
        expect(described_class.points(149, "gold")).to eq(2)
      end

      it "1ポイントに満たない金額は0" do
        expect(described_class.points(99, "regular")).to eq(0)
      end
    end

    context "異常系" do
      it "金額が0以下なら0" do
        expect(described_class.points(0, "gold")).to eq(0)
        expect(described_class.points(-500, "regular")).to eq(0)
      end
    end
  end
end
