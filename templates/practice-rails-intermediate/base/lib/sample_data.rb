# 開発用の初期データ（業務仕様 5章）。毎回同じ内容になるよう、乱数の種を固定する。
# 商品50件、会員200人、注文2,000件（過去6か月分）、クーポン5件、スタッフ3人
module SampleData
  CATEGORIES = {
    "食品" => [
      [ "国産こしひかり 5kg", 2980 ], [ "北海道産 じゃがいも 3kg", 1280 ], [ "さば味噌煮 缶詰 3缶セット", 780 ],
      [ "十勝あずき 300g", 640 ], [ "手延べそうめん 900g", 1180 ], [ "有機 玄米フレーク", 520 ],
      [ "焼きのり 全形10枚", 680 ], [ "国産はちみつ 500g", 1980 ], [ "だしパック 30袋", 1480 ]
    ],
    "飲料" => [
      [ "天然水 2L × 6本", 980 ], [ "静岡煎茶 100g", 1080 ], [ "ドリップコーヒー 20袋", 1280 ],
      [ "国産りんごジュース 1L", 480 ], [ "炭酸水 500ml × 24本", 1680 ], [ "ほうじ茶 ティーバッグ 50袋", 720 ],
      [ "麦茶 ティーバッグ 54袋", 380 ], [ "甘酒 6本セット", 1500 ]
    ],
    "日用品" => [
      [ "ボックスティッシュ 5箱", 398 ], [ "トイレットペーパー 12ロール", 598 ], [ "洗濯洗剤 詰め替え 1.5kg", 698 ],
      [ "食器用洗剤 詰め替え", 298 ], [ "ハンドソープ 泡 本体", 348 ], [ "ごみ袋 45L 50枚", 428 ],
      [ "マスク 50枚", 698 ], [ "ウェットティッシュ 3個パック", 358 ], [ "歯ブラシ 4本セット", 398 ]
    ],
    "キッチン用品" => [
      [ "ステンレス 片手鍋 18cm", 3480 ], [ "木製まな板", 2280 ], [ "三徳包丁 165mm", 4980 ],
      [ "耐熱ガラス 保存容器 3点", 1980 ], [ "シリコン 菜箸", 680 ], [ "計量カップ 500ml", 580 ],
      [ "鉄製 フライパン 26cm", 5800 ], [ "キッチンタイマー", 980 ]
    ],
    "文具" => [
      [ "ノート A5 5冊", 480 ], [ "ゲルインクボールペン 10本", 980 ], [ "付箋 カラー 10冊", 580 ],
      [ "クリアファイル A4 20枚", 380 ], [ "ホッチキス", 680 ], [ "修正テープ 3個", 520 ],
      [ "方眼メモパッド", 280 ], [ "万年筆 入門用", 2200 ]
    ],
    "ギフト" => [
      [ "季節のフルーツ詰め合わせ", 5400 ], [ "お菓子の詰め合わせ", 3240 ], [ "今治タオル ギフトセット", 4320 ],
      [ "日本茶 飲み比べセット", 3780 ], [ "高級海苔 詰め合わせ", 5940 ], [ "ジャム 3本セット", 2700 ],
      [ "カタログギフト 5,000円コース", 5500 ], [ "米 食べ比べ 3種", 3300 ]
    ]
  }.freeze

  FAMILY_NAMES = %w[佐藤 鈴木 高橋 田中 伊藤 渡辺 山本 中村 小林 加藤 吉田 山田 佐々木 山口 松本].freeze
  GIVEN_NAMES = %w[陽翔 結衣 蓮 陽葵 湊 凛 大和 芽依 悠真 さくら 蒼 美咲 樹 葵 颯太].freeze

  module_function

  def load!(members: 200, orders: 2000, now: Time.current)
    random = Random.new(20260401)

    CATEGORIES.each do |category_name, products|
      category = Category.create!(name: category_name)
      products.each do |name, price|
        index = Product.count
        Product.create!(
          name:, price:, category:, description: "#{category_name}の定番商品です。",
          # 一部の商品は非公開にしておく（販売終了など）
          published: index % 17 != 16,
          stock: 300
        )
      end
    end

    ranks = %w[regular regular regular silver silver gold]
    members.times do |i|
      n = format("%04d", i + 1)
      Member.create!(
        name: "#{FAMILY_NAMES.sample(random:)} #{GIVEN_NAMES.sample(random:)}",
        email: "member#{n}@example.com", rank: ranks.sample(random:), api_token: "member-#{n}-token",
        created_at: now - random.rand(200..400).days
      )
    end

    Coupon.create!([
      { code: "WELCOME500", discount_type: "fixed", discount_value: 500, min_amount: 3000, starts_at: now - 365.days, ends_at: now + 365.days },
      { code: "SPRING10", discount_type: "percent", discount_value: 10, min_amount: 0, starts_at: now - 180.days, ends_at: now + 30.days },
      { code: "GIFT1000", discount_type: "fixed", discount_value: 1000, min_amount: 8000, starts_at: now - 180.days, ends_at: now + 90.days },
      { code: "SUMMER15", discount_type: "percent", discount_value: 15, min_amount: 5000, starts_at: now - 400.days, ends_at: now - 300.days },
      { code: "THANKS300", discount_type: "fixed", discount_value: 300, min_amount: 1000, starts_at: now - 180.days, ends_at: now + 180.days }
    ])

    User.create!([
      { name: "管理者 さくら", email_address: "admin@sakura-mart.example", password: "password", role: "admin" },
      { name: "店舗 たろう", email_address: "staff1@sakura-mart.example", password: "password", role: "staff" },
      { name: "店舗 はなこ", email_address: "staff2@sakura-mart.example", password: "password", role: "staff" }
    ])

    # 注文は古い順に作る。古い注文ほど、発送・完了まで進んでいる
    product_ids = Product.published.order(:id).pluck(:id)
    member_ids = Member.order(:id).pluck(:id)
    coupon_codes = %w[WELCOME500 SPRING10 GIFT1000 THANKS300]
    orders.times do |i|
      days_ago = 180.0 * (1 - i.fdiv(orders))
      ordered_at = now - days_ago.days - random.rand(0..86_399).seconds
      items = Array.new(random.rand(1..4)) { { product_id: product_ids.sample(random:), quantity: random.rand(1..3) } }
                   .uniq { |item| item[:product_id] }
      member = Member.find(member_ids.sample(random:))
      coupon_code = random.rand < 0.1 ? coupon_codes.sample(random:) : nil
      order = begin
        OrderCreator.call(member:, items:, coupon_code:, now: ordered_at)
      rescue OrderCreator::Error
        # クーポンの条件を満たさない注文は、クーポンなしで作る
        OrderCreator.call(member:, items:, now: ordered_at)
      end

      roll = random.rand
      status = if roll < 0.05 then "cancelled"
      elsif days_ago > 14 then "completed"
      elsif days_ago > 5 then "shipped"
      elsif days_ago > 1 then "paid"
      else "pending"
      end
      order.update!(status:)
    end
  end
end
