# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "管理画面: 商品の登録・編集・非公開化", type: :request do
  let!(:category) { create(:category, name: "飲料") }
  let(:valid_params) do
    { product: { name: "静岡煎茶 100g", description: "深蒸しの煎茶です。", price: 1080, stock: 30, category_id: category.id, published: "1" } }
  end

  context "ログインしていないとき" do
    it "登録画面・登録・更新はログイン画面に移動する" do
      get "/admin/products/new"
      expect(response).to redirect_to(new_session_path)
      expect { post "/admin/products", params: valid_params }.not_to change(Product, :count)
    end
  end

  context "ログインしているとき" do
    before { sign_in_as(create(:user)) }

    describe "登録" do
      it "登録画面に、項目の入力欄がある" do
        get "/admin/products/new"
        expect(response).to have_http_status(:ok)
        %w[product[name] product[description] product[price] product[stock] product[category_id] product[published]].each do |name|
          expect(response.body).to include(%(name="#{name}"))
        end
      end

      it "正しい入力なら登録して一覧に戻り、メッセージを表示する" do
        expect { post "/admin/products", params: valid_params }.to change(Product, :count).by(1)
        expect(Product.last).to have_attributes(name: "静岡煎茶 100g", price: 1080, stock: 30, category:, published: true)
        expect(response).to redirect_to("/admin/products")
        follow_redirect!
        expect(response.body).to include("「静岡煎茶 100g」を登録しました")
      end

      it "入力に誤りがあれば 422 で、フォームとエラーメッセージを表示する（入力した値は残す）" do
        params = valid_params.deep_merge(product: { name: "", price: -1 })
        expect { post "/admin/products", params: }.not_to change(Product, :count)
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include("商品名を入力してください", "深蒸しの煎茶です。")
      end

      it "許可していない項目（id、created_at など）は受け付けない" do
        params = valid_params.deep_merge(product: { id: 99_999, created_at: "2000-01-01" })
        post "/admin/products", params: params
        product = Product.last
        expect(product.id).not_to eq(99_999)
        expect(product.created_at.year).not_to eq(2000)
      end
    end

    describe "編集" do
      let!(:product) { create(:product, name: "麦茶", price: 380, category:) }

      it "編集画面に、いまの値が入っている" do
        get "/admin/products/#{product.id}/edit"
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(%(value="麦茶"), %(value="380"))
      end

      it "正しい入力なら更新して一覧に戻り、メッセージを表示する" do
        patch "/admin/products/#{product.id}", params: { product: { name: "麦茶 ティーバッグ 54袋", price: 400 } }
        expect(product.reload).to have_attributes(name: "麦茶 ティーバッグ 54袋", price: 400)
        expect(response).to redirect_to("/admin/products")
        follow_redirect!
        expect(response.body).to include("「麦茶 ティーバッグ 54袋」を更新しました")
      end

      it "入力に誤りがあれば 422 で、エラーメッセージを表示し、更新しない" do
        patch "/admin/products/#{product.id}", params: { product: { price: 0 } }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include("価格は0より大きい値にしてください")
        expect(product.reload.price).to eq(380)
      end
    end

    describe "非公開化" do
      let!(:product) { create(:product, name: "甘酒 6本セット", published: true) }

      it "PATCH /admin/products/:id/unpublish で非公開にし、一覧に戻ってメッセージを表示する" do
        patch "/admin/products/#{product.id}/unpublish"
        expect(product.reload.published).to be(false)
        expect(response).to redirect_to("/admin/products")
        follow_redirect!
        expect(response.body).to include("「甘酒 6本セット」を非公開にしました")
      end
    end

    describe "一覧" do
      it "登録画面へのリンクと、商品ごとの編集画面へのリンクがある" do
        product = create(:product)
        get "/admin/products"
        expect(response.body).to include(%(href="/admin/products/new"), %(href="/admin/products/#{product.id}/edit"))
      end
    end
  end
end
