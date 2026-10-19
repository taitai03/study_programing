require "rails_helper"

RSpec.describe SalesSummary do
  let(:now) { Time.zone.parse("2026-04-15 12:00") }

  it "今日の売上と件数を出す。キャンセルの注文は含めない" do
    create(:order, total: 1000, ordered_at: now - 1.hour)
    create(:order, total: 9999, ordered_at: now - 2.hours, status: "cancelled")
    expect(described_class.new(now:).today).to eq(sales: 1000, count: 1)
  end

  it "今月の売上と、日ごとの売上を出す" do
    create(:order, total: 1000, ordered_at: now - 1.hour)
    create(:order, total: 2000, ordered_at: now - 3.days)
    create(:order, total: 5000, ordered_at: now - 1.month)

    summary = described_class.new(now:)
    expect(summary.this_month).to eq(sales: 3000, count: 2)
    expect(summary.daily(days: 4).map { |d| d[:sales] }).to eq([ 2000, 0, 0, 1000 ])
  end

  it "日本時間の日付で区切る" do
    create(:order, total: 1000, ordered_at: Time.zone.parse("2026-04-15 00:00"))
    create(:order, total: 2000, ordered_at: Time.zone.parse("2026-04-14 23:59"))
    expect(described_class.new(now:).today).to eq(sales: 1000, count: 1)
  end

  it "今月よく売れた商品を、数量の多い順に出す" do
    tea = create(:product, name: "静岡煎茶")
    rice = create(:product, name: "こしひかり")
    create(:order_item, product: tea, quantity: 2, order: create(:order, ordered_at: now))
    create(:order_item, product: rice, quantity: 5, order: create(:order, ordered_at: now))
    create(:order_item, product: tea, quantity: 9, order: create(:order, ordered_at: now, status: "cancelled"))
    expect(described_class.new(now:).top_products).to eq([ { name: "こしひかり", quantity: 5 }, { name: "静岡煎茶", quantity: 2 } ])
  end
end
