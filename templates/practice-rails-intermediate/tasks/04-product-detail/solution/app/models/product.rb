class Product < ApplicationRecord
  belongs_to :category
  has_many :order_items, dependent: :restrict_with_error

  scope :published, -> { where(published: true) }

  validates :name, presence: true, length: { maximum: 100 }
  validates :price, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000 }
  # 税込の価格（端数は切り捨て）
  def price_with_tax
    price + price * Pricing::TAX_RATE / 100
  end

  # 累計の販売数（キャンセルの注文を除く）
  def sold_quantity
    order_items.joins(:order).merge(Order.for_sales).sum(:quantity)
  end

  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
