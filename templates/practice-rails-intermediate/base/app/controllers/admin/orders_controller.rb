class Admin::OrdersController < Admin::BaseController
  def index
    # TODO: 件数が増えてきたら、ページ分けと絞り込みを付ける
    @orders = Order.recent.includes(:member).limit(50)
  end

  def show
    @order = Order.includes(:member, :coupon, items: :product).find(params[:id])
  end
end
