class Admin::DashboardController < Admin::BaseController
  def show
    @summary = SalesSummary.new
    @recent_orders = Order.recent.includes(:member).limit(10)
  end
end
