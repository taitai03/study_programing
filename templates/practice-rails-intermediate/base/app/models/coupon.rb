class Coupon < ApplicationRecord
  # クーポンが使えないとき（期間外、最低購入金額に届かない）
  class NotApplicable < StandardError; end

  enum :discount_type, { fixed: "fixed", percent: "percent" }

  validates :code, presence: true, uniqueness: true
  validates :discount_value, numericality: { only_integer: true, greater_than: 0 }

  # クーポンの割引額。amount はランク割引のあとの金額（税抜）
  def discount_for(amount, now: Time.current)
    raise NotApplicable, "クーポンの利用期間前です" if now < starts_at
    raise NotApplicable, "クーポンの利用期間が終わっています" if now > ends_at
    if amount < min_amount
      raise NotApplicable, "クーポンは#{min_amount.to_fs(:delimited)}円以上の購入で使えます"
    end

    discount = fixed? ? discount_value : amount * discount_value / 100
    # 割引で金額がマイナスにならないようにする
    [ discount, amount ].min
  end
end
