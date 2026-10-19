class Product < ApplicationRecord
  belongs_to :category
  has_many :order_items, dependent: :restrict_with_error
  has_many :reviews, dependent: :destroy

  scope :published, -> { where(published: true) }

  # レビューの評価の平均（小数第1位で四捨五入）。レビューがなければ nil
  def average_rating
    reviews.average(:rating)&.round(1)&.to_f
  end

  validates :name, presence: true, length: { maximum: 100 }
  validates :price, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000 }
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
