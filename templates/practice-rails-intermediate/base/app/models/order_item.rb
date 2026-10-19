class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product

  validates :quantity, numericality: { only_integer: true, greater_than: 0 }

  def amount
    unit_price * quantity
  end
end
