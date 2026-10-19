# さくらマート 管理画面（Rails版）

架空のECショップ「さくらマート」の、スタッフ向け管理画面と会員向けAPIです。プログラミング研修の **Ruby / Rails 中級** の課題で使います。

## 構成

| 要素 | 使っているもの |
| --- | --- |
| フレームワーク | Ruby on Rails 8、Hotwire（ERB） |
| DB | SQLite（`storage/development.sqlite3`） |
| スタッフのログイン | Rails 標準の認証（`bin/rails generate authentication` で作ったもの） |
| テスト | RSpec、FactoryBot |

## 動かす

必要なもの: Ruby（バージョンは `.ruby-version`。mise などで入れる）

```bash
bundle install
bin/rails db:prepare   # テーブルを作る
bin/rails db:seed      # 初期データ（商品50件、会員200人、注文2,000件）を入れる（1分ほどかかります）
bin/rails server
```

http://localhost:3000 を開き、`admin@sakura-mart.example` / `password` でログインします。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `bundle exec rspec` | テストを実行する（`bundle exec rspec spec/models/pricing_spec.rb` のようにファイルを指定もできる） |
| `bin/rails console` | アプリのモデルを対話的に試す |
| `bin/rails routes` | ルーティングの一覧 |
| `bin/rails db:migrate` | マイグレーションを当てる（`db/schema.rb` も更新される） |
| `bin/rails db:reset` | DBを作り直して初期データを入れ直す |
| `bin/rubocop` | コードのスタイルのチェック |

## フォルダ構成

```
app/
├── controllers/
│   ├── admin/          # 管理画面（ログイン必須）
│   └── api/v1/         # 会員向けAPI
├── models/             # モデルと業務のロジック（料金計算、注文の作成、在庫の引き当て、売上の集計）
└── views/
    ├── admin/          # 管理画面の画面
    └── layouts/
db/
├── migrate/            # マイグレーション
└── schema.rb           # いまのテーブルの形（マイグレーションを当てると更新される）
lib/sample_data.rb      # 初期データ
spec/                   # テスト（RSpec）
```

## 業務のルール

料金計算（`app/models/pricing.rb`）は次の順番で行います。端数はすべて切り捨てです。

1. **小計**: 商品の価格（税抜）× 数量 の合計
2. **会員ランク割引**: 一般 0%、シルバー 5%、ゴールド 10%
3. **クーポン割引**: ランク割引のあとの金額に適用する。最低購入金額も、ランク割引のあとの金額で判定する
4. **消費税**: 割引後の金額に10%を加える
5. **送料**: 550円（税込）。消費税を加えた金額が5,000円以上なら無料
6. **合計**: 4 ＋ 5

ポイントは、4の金額（送料を含まない税込金額）の1%（ゴールド会員は2%）です。

注文のステータスは 受付（pending）→ 支払済（paid）→ 発送済（shipped）→ 完了（completed）と進みます。受付と支払済の注文はキャンセル（cancelled）できます。**売上の集計には、キャンセルの注文を含めません**。

## 会員向けAPI

`Authorization: Bearer <APIトークン>` で認証します。初期データの会員のトークンは `member-0001-token` のような形です。

```bash
curl http://localhost:3000/api/v1/products
curl -H "Authorization: Bearer member-0001-token" http://localhost:3000/api/v1/me/orders
curl -X POST -H "Authorization: Bearer member-0001-token" -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":2}],"coupon_code":"WELCOME500"}' \
  http://localhost:3000/api/v1/orders
```

## 課題の進め方

課題ごとに **開始ブランチ**（`start/04-product-detail` など）があります。課題文は開始ブランチの `TASK.md` にあります。

```bash
git switch start/04-product-detail
git switch -c work/04-product-detail
# 実装して commit
git push -u origin work/04-product-detail
# GitHub で start/04-product-detail に向けてPRを作る
```

PRを作ると GitHub Actions でテストが実行されます。課題で用意したテスト（`spec/tasks/`）、`spec/support/`、`spec/rails_helper.rb`、`.github/` は変更しないでください。変更したPRは判定の対象外になります。
