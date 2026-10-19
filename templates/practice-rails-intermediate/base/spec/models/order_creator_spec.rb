require "rails_helper"

RSpec.describe OrderCreator do
  let(:member) { create(:member, rank: "regular", points: 100) }
  let(:rice) { create(:product, name: "国産こしひかり 5kg", price: 2980, stock: 10) }

  it "注文を作り、注文時点の単価で明細を保存し、ポイントを会員に足す" do
    order = described_class.call(member:, items: [ { product_id: rice.id, quantity: 2 } ])

    expect(order).to be_persisted.and have_attributes(status: "pending", subtotal: 5960, total: 5960 + 596)
    expect(order.items.map { |i| [ i.product_id, i.quantity, i.unit_price ] }).to eq([ [ rice.id, 2, 2980 ] ])
    expect(member.reload.points).to eq(100 + order.points_earned)
  end

  it "注文した数だけ在庫を引き当てる" do
    described_class.call(member:, items: [ { product_id: rice.id, quantity: 3 } ])
    expect(rice.reload.stock).to eq(7)
  end

  it "非公開の商品や存在しない商品は注文できない" do
    hidden = create(:product, published: false)
    expect { described_class.call(member:, items: [ { product_id: hidden.id, quantity: 1 } ]) }
      .to raise_error(OrderCreator::Error, /購入できない商品/)
    expect { described_class.call(member:, items: [ { product_id: 0, quantity: 1 } ]) }
      .to raise_error(OrderCreator::Error)
  end

  it "存在しないクーポンや、条件を満たさないクーポンは使えない" do
    create(:coupon, code: "GIFT1000", min_amount: 8000)
    expect { described_class.call(member:, items: [ { product_id: rice.id, quantity: 1 } ], coupon_code: "NOPE") }
      .to raise_error(OrderCreator::Error, "クーポンが見つかりません")
    expect { described_class.call(member:, items: [ { product_id: rice.id, quantity: 1 } ], coupon_code: "GIFT1000") }
      .to raise_error(OrderCreator::Error, /8,000円以上/)
  end
end
