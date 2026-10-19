require "rails_helper"

RSpec.describe "会員向けAPI", type: :request do
  let(:member) { create(:member) }
  let(:headers) { { "Authorization" => "Bearer #{member.api_token}" } }
  let!(:rice) { create(:product, name: "国産こしひかり 5kg", price: 2980) }

  describe "GET /api/v1/products" do
    it "公開中の商品だけを返す" do
      create(:product, published: false)
      get api_v1_products_path
      products = response.parsed_body["products"]
      expect(products.map { |p| p["name"] }).to eq([ "国産こしひかり 5kg" ])
      expect(products.first.keys).to contain_exactly("id", "name", "description", "price", "category")
    end

    it "非公開の商品の詳細は 404" do
      hidden = create(:product, published: false)
      get api_v1_product_path(hidden)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/orders" do
    it "会員のAPIトークンで注文を作れる" do
      post api_v1_orders_path, params: { items: [ { product_id: rice.id, quantity: 1 } ] }, headers:, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("order", "member_id")).to eq(member.id)
    end

    it "トークンが正しくなければ 401、注文できなければ 422" do
      post api_v1_orders_path, params: { items: [ { product_id: rice.id, quantity: 1 } ] }, as: :json
      expect(response).to have_http_status(:unauthorized)

      post api_v1_orders_path, params: { items: [ { product_id: 0, quantity: 1 } ] }, headers:, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("購入できない商品")
    end
  end

  describe "GET /api/v1/me/orders" do
    it "自分の注文だけを返す" do
      OrderCreator.call(member:, items: [ { product_id: rice.id, quantity: 1 } ])
      OrderCreator.call(member: create(:member), items: [ { product_id: rice.id, quantity: 1 } ])
      get api_v1_me_orders_path, headers: headers
      expect(response.parsed_body["orders"].size).to eq(1)
    end
  end
end
