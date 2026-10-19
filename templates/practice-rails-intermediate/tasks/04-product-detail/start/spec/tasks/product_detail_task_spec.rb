# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "管理画面: 商品詳細", type: :request do
  let(:category) { create(:category, name: "食品") }
  let(:product) do
    create(:product, name: "国産こしひかり 5kg", price: 2980, stock: 42, category:,
                     description: "新潟県産のこしひかりです。")
  end

  context "ログインしていないとき" do
    it "ログイン画面に移動する" do
      get "/admin/products/#{product.id}"
      expect(response).to redirect_to(new_session_path)
    end
  end

  context "ログインしているとき" do
    before { sign_in_as(create(:user)) }

    it "商品の情報（名前、カテゴリ、税抜と税込の価格、在庫、公開状態、説明）を表示する" do
      get "/admin/products/#{product.id}"
      expect(response).to have_http_status(:ok)
      body = response.body
      expect(body).to include("国産こしひかり 5kg", "食品", "2,980円", "3,278円", "42", "公開", "新潟県産のこしひかりです。")
    end

    it "非公開の商品は「非公開」と表示する" do
      product.update!(published: false)
      get "/admin/products/#{product.id}"
      expect(response.body).to include("非公開")
    end

    it "累計の販売数を表示する（キャンセルの注文は含めない）" do
      create(:order_item, product:, quantity: 2, order: create(:order, status: "completed"))
      create(:order_item, product:, quantity: 3, order: create(:order, status: "paid"))
      create(:order_item, product:, quantity: 9, order: create(:order, status: "cancelled"))
      get "/admin/products/#{product.id}"
      expect(response.body).to include("累計販売数: 5個")
    end

    it "存在しない商品は 404" do
      get "/admin/products/0"
      expect(response).to have_http_status(:not_found)
    end

    it "商品一覧から、商品名のリンクで詳細に移動できる" do
      product
      get "/admin/products"
      expect(response.body).to include(%(href="/admin/products/#{product.id}"))
    end
  end
end
