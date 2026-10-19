require "rails_helper"

RSpec.describe Pricing do
  let(:now) { Time.zone.parse("2026-04-15 12:00") }

  def calc(items, rank: "regular", coupon: nil)
    described_class.calculate(items:, rank:, coupon:, now:)
  end

  it "一般会員: 小計に消費税を足し、5,000円未満なら送料550円" do
    result = calc([ { unit_price: 1000, quantity: 2 } ])
    expect(result.to_h).to eq(
      subtotal: 2000, rank_discount: 0, coupon_discount: 0, tax: 200, shipping_fee: 550, total: 2750, points: 22
    )
  end

  it "税込でちょうど5,000円なら送料無料" do
    result = calc([ { unit_price: 4546, quantity: 1 } ])
    expect(result.tax).to eq(454)
    expect(result.shipping_fee).to eq(0)
    expect(result.total).to eq(5000)
  end

  it "ゴールド会員: 10%引き、ポイントは2%" do
    result = calc([ { unit_price: 3333, quantity: 3 } ], rank: "gold")
    expect(result).to have_attributes(subtotal: 9999, rank_discount: 999, tax: 900, total: 9900, points: 198)
  end

  it "クーポンはランク割引のあとの金額に適用し、最低購入金額もランク割引のあとで判定する" do
    coupon = build(:coupon, discount_type: "percent", discount_value: 10, min_amount: 2850,
                            starts_at: now - 1.day, ends_at: now + 1.day)
    result = calc([ { unit_price: 3000, quantity: 1 } ], rank: "silver", coupon:)
    expect(result).to have_attributes(rank_discount: 150, coupon_discount: 285, tax: 256, total: 2565 + 256 + 550)
  end

  it "最低購入金額に届かないクーポンはエラー" do
    coupon = build(:coupon, min_amount: 3000, starts_at: now - 1.day, ends_at: now + 1.day)
    expect { calc([ { unit_price: 3000, quantity: 1 } ], rank: "silver", coupon:) }
      .to raise_error(Coupon::NotApplicable, /3,000円以上/)
  end
end
