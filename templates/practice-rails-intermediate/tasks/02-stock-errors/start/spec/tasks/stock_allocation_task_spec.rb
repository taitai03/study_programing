# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "在庫の引き当て" do
  let(:tea) { create(:product, name: "静岡煎茶 100g", stock: 5) }
  let(:rice) { create(:product, name: "国産こしひかり 5kg", stock: 2) }

  describe Stockable do
    it "Product に include されている" do
      expect(Product.include?(Stockable)).to be(true)
    end

    it "in_stock?(数量): 在庫がその数以上あれば true（数量を省略すると1）" do
      expect(tea.in_stock?(5)).to be(true)
      expect(tea.in_stock?(6)).to be(false)
      expect(build(:product, stock: 0).in_stock?).to be(false)
      expect(build(:product, stock: 1).in_stock?).to be(true)
    end

    it "low_stock?: 在庫が LOW_STOCK_THRESHOLD（10）個以下なら true" do
      expect(Stockable::LOW_STOCK_THRESHOLD).to eq(10)
      expect(build(:product, stock: 10).low_stock?).to be(true)
      expect(build(:product, stock: 11).low_stock?).to be(false)
    end
  end

  describe StockAllocator do
    it "在庫が足りれば、明細の数だけ在庫を減らす" do
      StockAllocator.new([ { product: tea, quantity: 5 }, { product: rice, quantity: 1 } ]).allocate!
      expect([ tea.reload.stock, rice.reload.stock ]).to eq([ 0, 1 ])
    end

    it "在庫が足りない商品があれば InsufficientStockError。どの商品の在庫も減らさない" do
      allocator = StockAllocator.new([ { product: tea, quantity: 2 }, { product: rice, quantity: 3 } ])
      expect { allocator.allocate! }.to raise_error(StockAllocator::InsufficientStockError) { |e|
        expect(e.product).to eq(rice)
        expect(e.requested).to eq(3)
        expect(e.available).to eq(2)
        expect(e.message).to eq("「国産こしひかり 5kg」の在庫が足りません（注文: 3個、在庫: 2個）")
      }
      expect([ tea.reload.stock, rice.reload.stock ]).to eq([ 5, 2 ])
    end

    it "同じ商品が複数の明細にあれば、合計の数量で確かめる" do
      allocator = StockAllocator.new([ { product: tea, quantity: 3 }, { product: tea, quantity: 3 } ])
      expect { allocator.allocate! }.to raise_error(StockAllocator::InsufficientStockError) { |e|
        expect(e.requested).to eq(6)
      }
      expect(tea.reload.stock).to eq(5)
    end

    it "InsufficientStockError は StandardError を継承している（rescue => e で受け止められる）" do
      expect(StockAllocator::InsufficientStockError.ancestors).to include(StandardError)
    end
  end

  describe "注文の作成", type: :request do
    let(:member) { create(:member, points: 0) }

    it "在庫が足りなければ OrderCreator::Error（同じメッセージ）。注文もポイントも変えない" do
      expect {
        expect { OrderCreator.call(member:, items: [ { product_id: rice.id, quantity: 3 } ]) }
          .to raise_error(OrderCreator::Error, "「国産こしひかり 5kg」の在庫が足りません（注文: 3個、在庫: 2個）")
      }.not_to change { [ Order.count, member.reload.points ] }
    end

    it "会員向けAPIでは 422 で、在庫が足りない理由を返す" do
      post "/api/v1/orders",
           params: { items: [ { product_id: rice.id, quantity: 3 } ] },
           headers: { "Authorization" => "Bearer #{member.api_token}" }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("在庫が足りません")
    end
  end
end
