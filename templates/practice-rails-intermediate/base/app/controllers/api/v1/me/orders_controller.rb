# 会員向け: 自分の注文履歴
class Api::V1::Me::OrdersController < Api::V1::BaseController
  before_action :require_member!

  def index
    orders = current_member.orders.recent.includes(items: :product)
    render json: {
      orders: orders.map do |o|
        {
          id: o.id, status: o.status, total: o.total, points_earned: o.points_earned, ordered_at: o.ordered_at,
          items: o.items.map { |i| { product_id: i.product_id, name: i.product.name, quantity: i.quantity, unit_price: i.unit_price } }
        }
      end
    }
  end
end
