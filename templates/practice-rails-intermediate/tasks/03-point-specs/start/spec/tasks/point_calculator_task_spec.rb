# 課題のテスト（変更しないでください）。ポイント計算の不具合が直っていることを確かめる
require "rails_helper"

RSpec.describe PointCalculator do
  it "端数は切り捨てる" do
    expect(described_class.points(1250, "regular")).to eq(12)
    expect(described_class.points(1299, "silver")).to eq(12)
    expect(described_class.points(1275, "gold")).to eq(25)
  end
end
