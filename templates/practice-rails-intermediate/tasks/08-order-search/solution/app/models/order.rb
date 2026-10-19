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
  # この日（日本時間）以降の注文
  scope :ordered_from, ->(date) { where(ordered_at: date.in_time_zone.beginning_of_day..) }
  # この日（日本時間）までの注文（その日の終わりまで含む）
  scope :ordered_until, ->(date) { where(ordered_at: ...(date + 1).in_time_zone.beginning_of_day) }

  def status_label
    STATUS_LABELS.fetch(status)
  end
end
