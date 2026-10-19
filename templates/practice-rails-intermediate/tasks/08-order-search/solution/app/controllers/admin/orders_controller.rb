class Admin::OrdersController < Admin::BaseController
  # GET /admin/orders（画面）と GET /admin/orders.json（JSON API）
  # ?from=2026-04-01&to=2026-04-15（日本時間、両端を含む）、?status=paid、?page=2
  def index
    @search = OrderSearch.new(params.permit(:from, :to, :status, :page))
    unless @search.valid?
      @orders = Order.none
      @error = @search.errors.full_messages.first
      respond_to do |format|
        format.html { render :index, status: :bad_request }
        format.json { render json: { error: @error }, status: :bad_request }
      end
      return
    end

    @orders = @search.results
    respond_to do |format|
      format.html
      format.json do
        render json: {
          orders: @orders.map { |o| order_json(o) },
          page: @search.current_page, total_pages: @search.total_pages, total_count: @search.total_count
        }
      end
    end
  end

  def show
    @order = Order.includes(:member, :coupon, items: :product).find(params[:id])
  end

  private
    def order_json(order)
      {
        id: order.id,
        member: { id: order.member.id, name: order.member.name },
        status: order.status,
        total: order.total,
        ordered_at: order.ordered_at.iso8601
      }
    end
end
