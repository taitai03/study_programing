# 会員。会員向けAPIは api_token で認証する
class Member < ApplicationRecord
  RANK_LABELS = { "regular" => "一般", "silver" => "シルバー", "gold" => "ゴールド" }.freeze

  has_many :orders, dependent: :restrict_with_error

  enum :rank, { regular: "regular", silver: "silver", gold: "gold" }, default: "regular"

  has_secure_token :api_token
  normalizes :email, with: ->(e) { e.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  def rank_label
    RANK_LABELS.fetch(rank)
  end
end
