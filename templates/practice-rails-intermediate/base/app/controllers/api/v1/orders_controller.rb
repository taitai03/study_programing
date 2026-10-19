# 会員向け: 注文を作る
class Api::V1::OrdersController < Api::V1::BaseController
  before_action :require_member!

  def create
    order = OrderCreator.call(member: current_member, items: item_params, coupon_code: params[:coupon_code])
    render json: { order: order.as_json(except: %i[created_at updated_at]) }, status: :created
  rescue OrderCreator::Error => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private
    def item_params
      Array(params.require(:items)).map do |item|
        { product_id: item[:product_id].to_i, quantity: item[:quantity] }
      end
    end
end
