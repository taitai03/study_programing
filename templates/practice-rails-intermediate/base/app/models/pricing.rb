# 注文の金額を計算する（業務仕様 3.3）。端数はすべて切り捨て
# 1. 小計 → 2. 会員ランク割引 → 3. クーポン割引 → 4. 消費税 → 5. 送料 → 6. 合計
module Pricing
  RANK_DISCOUNT_RATES = { "regular" => 0, "silver" => 5, "gold" => 10 }.freeze
  TAX_RATE = 10
  SHIPPING_FEE = 550
  FREE_SHIPPING_THRESHOLD = 5_000

  Result = Data.define(:subtotal, :rank_discount, :coupon_discount, :tax, :shipping_fee, :total, :points)

  module_function

  # items: [{ unit_price:, quantity: }]
  def calculate(items:, rank:, coupon: nil, now: Time.current)
    subtotal = items.sum { |item| item[:unit_price] * item[:quantity] }
    rank_discount = subtotal * RANK_DISCOUNT_RATES.fetch(rank.to_s) / 100
    after_rank = subtotal - rank_discount

    coupon_discount = coupon ? coupon.discount_for(after_rank, now: now) : 0
    discounted = after_rank - coupon_discount

    tax = discounted * TAX_RATE / 100
    tax_included = discounted + tax
    shipping_fee = tax_included >= FREE_SHIPPING_THRESHOLD || items.empty? ? 0 : SHIPPING_FEE

    Result.new(
      subtotal:, rank_discount:, coupon_discount:, tax:, shipping_fee:,
      total: tax_included + shipping_fee,
      points: PointCalculator.points(tax_included, rank)
    )
  end
end
