class Order < ApplicationRecord
  STATUS_LABELS = {
    "pending" => "受付", "paid" => "支払済", "shipped" => "発送済", "completed" => "完了", "cancelled" => "キャンセル"
  }.freeze

  belongs_to :member
  belongs_to :coupon, optional: true
  has_many :items, class_name: "OrderItem", dependent: :destroy

  enum :status, { pending: "pending", paid: "paid", shipped: "shipped", completed: "completed", cancelled: "cancelled" },
       default: "pending"

  # 売上の集計に含める注文（キャンセルを除く。業務仕様 3.2）
  scope :for_sales, -> { where.not(status: "cancelled") }
  scope :recent, -> { order(ordered_at: :desc, id: :desc) }

  def status_label
    STATUS_LABELS.fetch(status)
  end
end
