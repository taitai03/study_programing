# 会員が書く商品のレビュー。購入した商品だけ、1商品につき1つ書ける
class Review < ApplicationRecord
  belongs_to :product
  belongs_to :member

  validates :rating, presence: true,
                     numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :body, length: { maximum: 1000 }
  validates :member_id, uniqueness: { scope: :product_id, message: "はこの商品のレビューをすでに書いています" }
  validate :member_must_have_purchased

  private
    def member_must_have_purchased
      return if member.nil? || product.nil?

      purchased = OrderItem.joins(:order).merge(Order.for_sales)
                           .where(product:, orders: { member_id: member.id }).exists?
      errors.add(:base, "購入した商品だけレビューできます") unless purchased
    end
end
