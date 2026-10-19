FactoryBot.define do
  factory :user do
    sequence(:name) { |n| "スタッフ#{n}" }
    sequence(:email_address) { |n| "staff#{n}@sakura-mart.example" }
    password { "password" }
    role { "staff" }

    trait :admin do
      role { "admin" }
    end
  end

  factory :category do
    sequence(:name) { |n| "カテゴリ#{n}" }
  end

  factory :product do
    sequence(:name) { |n| "商品#{n}" }
    price { 1000 }
    stock { 100 }
    category
  end

  factory :member do
    sequence(:name) { |n| "会員#{n}" }
    sequence(:email) { |n| "member#{n}@example.com" }
    rank { "regular" }
  end

  factory :coupon do
    sequence(:code) { |n| "COUPON#{n}" }
    discount_type { "fixed" }
    discount_value { 500 }
    min_amount { 0 }
    starts_at { 1.month.ago }
    ends_at { 1.month.from_now }
  end

  # 金額は明細に合わせて計算せず、指定した値で保存する（集計のテスト用）。
  # 正しい金額の注文を作りたいときは OrderCreator を使う
  factory :order do
    member
    status { "completed" }
    subtotal { 1000 }
    rank_discount { 0 }
    coupon_discount { 0 }
    tax { 100 }
    shipping_fee { 550 }
    total { 1650 }
    points_earned { 11 }
    ordered_at { Time.current }
  end

  factory :order_item do
    order
    product
    quantity { 1 }
    unit_price { product.price }
  end
end
