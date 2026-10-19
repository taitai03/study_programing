# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "商品レビュー" do
  let(:product) { create(:product, name: "静岡煎茶 100g") }
  let(:member) { create(:member) }

  # member が product を購入した（キャンセル以外の注文がある）状態にする
  def purchase!(member, product, status: "completed")
    create(:order_item, product:, order: create(:order, member:, status:))
  end

  describe "テーブル" do
    it "reviews テーブルに必要な列があり、必須の列は NOT NULL" do
      columns = Review.columns.index_by(&:name)
      expect(columns.keys).to include("product_id", "member_id", "rating", "body", "created_at", "updated_at")
      expect(columns.values_at("product_id", "member_id", "rating").map(&:null)).to all(be(false))
    end

    it "同じ会員が同じ商品に2つレビューを書けないよう、DBにも一意の制約がある" do
      index = ActiveRecord::Base.connection.indexes(:reviews).find { |i| i.columns.sort == %w[member_id product_id] }
      expect(index&.unique).to be(true)
    end
  end

  describe Review do
    before { purchase!(member, product) }

    it "評価（1〜5の整数）と本文で作れる。商品と会員に関連付いている" do
      review = Review.create!(product:, member:, rating: 5, body: "香りがよくておいしいです")
      expect(product.reviews).to eq([ review ])
      expect(member.reviews).to eq([ review ])
    end

    it "本文はなくてもよい（1000文字まで）" do
      expect(Review.new(product:, member:, rating: 3)).to be_valid
      expect(Review.new(product:, member:, rating: 3, body: "あ" * 1001)).not_to be_valid
    end

    it "評価は必須で、1〜5の整数だけ" do
      [ nil, 0, 6, 2.5 ].each do |rating|
        review = Review.new(product:, member:, rating:)
        expect(review).not_to be_valid
        expect(review.errors[:rating]).to be_present
      end
    end

    it "同じ会員は、同じ商品に1つだけレビューを書ける" do
      Review.create!(product:, member:, rating: 4)
      second = Review.new(product:, member:, rating: 5)
      expect(second).not_to be_valid
      expect(second.errors[:member_id]).to be_present
    end

    it "購入した（キャンセル以外の注文がある）商品だけレビューを書ける" do
      other = create(:product)
      review = Review.new(product: other, member:, rating: 5)
      expect(review).not_to be_valid
      expect(review.errors[:base]).to include("購入した商品だけレビューできます")

      purchase!(member, other, status: "cancelled")
      expect(Review.new(product: other, member:, rating: 5)).not_to be_valid
    end

    it "商品や会員を削除すると、レビューも削除される" do
      Review.create!(product:, member:, rating: 4)
      expect { product.reviews.destroy_all }.to change(Review, :count).by(-1)
      expect(Product.reflect_on_association(:reviews).options[:dependent]).to eq(:destroy)
      expect(Member.reflect_on_association(:reviews).options[:dependent]).to eq(:destroy)
    end
  end

  describe "Product#average_rating" do
    it "評価の平均を小数第1位で四捨五入して返す。レビューがなければ nil" do
      expect(product.average_rating).to be_nil
      [ 5, 4, 4 ].each do |rating|
        m = create(:member)
        purchase!(m, product)
        Review.create!(product:, member: m, rating:)
      end
      expect(product.average_rating).to eq(4.3)
    end
  end

  describe "会員向けAPI", type: :request do
    let(:headers) { { "Authorization" => "Bearer #{member.api_token}" } }

    it "POST /api/v1/products/:id/reviews でレビューを書ける" do
      purchase!(member, product)
      post "/api/v1/products/#{product.id}/reviews", params: { rating: 5, body: "おいしい" }, headers:, as: :json
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["review"]).to include("rating" => 5, "body" => "おいしい", "product_id" => product.id)
    end

    it "条件に合わなければ 422 で、項目ごとのエラーメッセージを返す" do
      purchase!(member, product)
      post "/api/v1/products/#{product.id}/reviews", params: { rating: 9 }, headers:, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("errors", "rating")).to be_an(Array).and(be_present)
    end

    it "購入していない商品は 422 で、理由を返す" do
      post "/api/v1/products/#{product.id}/reviews", params: { rating: 5 }, headers:, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("errors", "base")).to include("購入した商品だけレビューできます")
    end

    it "ログインしていなければ 401、非公開の商品は 404" do
      post "/api/v1/products/#{product.id}/reviews", params: { rating: 5 }, as: :json
      expect(response).to have_http_status(:unauthorized)
      hidden = create(:product, published: false)
      post "/api/v1/products/#{hidden.id}/reviews", params: { rating: 5 }, headers:, as: :json
      expect(response).to have_http_status(:not_found)
    end

    it "商品の詳細に、評価の平均とレビューの数を含める" do
      purchase!(member, product)
      Review.create!(product:, member:, rating: 4)
      get "/api/v1/products/#{product.id}"
      expect(response.parsed_body["product"]).to include("average_rating" => 4.0, "reviews_count" => 1)
    end
  end
end
