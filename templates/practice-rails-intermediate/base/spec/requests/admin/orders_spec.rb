require "rails_helper"

RSpec.describe "管理画面: 注文", type: :request do
  before { sign_in_as(create(:user)) }

  it "注文一覧を新しい順に表示する" do
    older = create(:order, ordered_at: 2.days.ago)
    newer = create(:order, ordered_at: 1.hour.ago)
    get admin_orders_path
    expect(response).to have_http_status(:ok)
    expect(response.body.index("##{newer.id}")).to be < response.body.index("##{older.id}")
  end

  it "注文の詳細を表示する" do
    order = create(:order)
    create(:order_item, order:, product: create(:product, name: "静岡煎茶 100g"))
    get admin_order_path(order)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("静岡煎茶 100g")
  end
end
