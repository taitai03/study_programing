# 課題のテスト（変更しないでください）。売上の集計にキャンセルの注文が含まれないことを確かめる
require "rails_helper"

RSpec.describe SalesSummary do
  let(:now) { Time.zone.parse("2026-04-15 12:00") }
  let(:summary) { described_class.new(now:) }

  before do
    create(:order, total: 1000, ordered_at: now - 1.hour)
    create(:order, total: 2000, ordered_at: now - 3.days)
    create(:order, total: 7777, ordered_at: now - 2.hours, status: "cancelled")
    create(:order, total: 8888, ordered_at: now - 3.days, status: "cancelled")
  end

  it "今日の売上" do
    expect(summary.today).to eq(sales: 1000, count: 1)
  end

  it "今月の売上" do
    expect(summary.this_month).to eq(sales: 3000, count: 2)
  end

  it "日ごとの売上" do
    expect(summary.daily(days: 4).map { |d| [ d[:sales], d[:count] ] }).to eq([ [ 2000, 1 ], [ 0, 0 ], [ 0, 0 ], [ 1000, 1 ] ])
  end
end

RSpec.describe "管理画面のダッシュボード", type: :request do
  let(:now) { Time.zone.parse("2026-04-15 12:00") }

  it "キャンセルの金額を売上に含めない" do
    create(:order, total: 1000, ordered_at: now - 1.hour)
    create(:order, total: 2000, ordered_at: now - 3.days)
    create(:order, total: 7777, ordered_at: now - 2.hours, status: "cancelled")
    create(:order, total: 8888, ordered_at: now - 3.days, status: "cancelled")
    travel_to(now) do
      sign_in_as(create(:user))
      get "/admin"
      expect(response.body).to include("3,000円")
      expect(response.body).not_to include("10,777円", "11,777円", "10,888円")
    end
  end
end
