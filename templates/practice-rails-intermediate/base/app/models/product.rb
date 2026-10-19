class Product < ApplicationRecord
  belongs_to :category
  has_many :order_items, dependent: :restrict_with_error

  scope :published, -> { where(published: true) }

  validates :name, presence: true, length: { maximum: 100 }
  validates :price, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000 }
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
