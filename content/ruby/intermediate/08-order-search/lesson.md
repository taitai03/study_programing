---
title: 検索とJSON API
summary: scope、クエリの組み立て、ページネーション、JSON API を学びます。注文一覧に期間とステータスの絞り込みを追加し、同じ条件で取れる JSON API も作ります。
minutes: 60
---

## scope で条件に名前を付ける

よく使う検索の条件は、モデルに **scope** として名前を付けます。scope はつなげられるので、条件を組み立てるのに便利です。

```ruby
class Order < ApplicationRecord
  scope :recent, -> { order(ordered_at: :desc, id: :desc) }
  scope :ordered_from, ->(date) { where(ordered_at: date.in_time_zone.beginning_of_day..) }
  scope :ordered_until, ->(date) { where(ordered_at: ...(date + 1).in_time_zone.beginning_of_day) }
end

Order.recent.ordered_from(Date.new(2026, 4, 1)).where(status: "paid")
```

| 書き方 | SQL |
| --- | --- |
| `where(ordered_at: a..b)` | `ordered_at BETWEEN a AND b` |
| `where(ordered_at: a..)` | `ordered_at >= a` |
| `where(ordered_at: ...b)` | `ordered_at < b` |

「4月15日まで（その日を含む）」は、**4月16日 0時より前**（`...翌日の0時`）と書くと、日の終わりの取りこぼしがありません。

## 条件を組み立てる

条件が指定されたときだけ絞り込むには、relation（検索条件のかたまり）に少しずつ足していきます。ActiveRecord の relation は、**データを使うまで SQL を実行しない**（遅延評価）ので、組み立てる途中では何度つないでもかまいません。

```ruby
orders = Order.recent
orders = orders.ordered_from(from_date) if from_date
orders = orders.where(status:) if status.present?
orders.limit(50) # ここで初めて SQL が実行される
```

検索の条件が増えてきたら、**検索のためのクラス**（`OrderSearch` など）にまとめると、コントローラーがすっきりし、条件のチェック（バリデーション）もそこに書けます。`ActiveModel::Model` を include すると、DBのテーブルがなくても `valid?` や `errors` が使えます。

```ruby
class OrderSearch
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :from, :string
  attribute :status, :string
  validates :status, inclusion: { in: Order.statuses.keys }, allow_blank: true
end
```

## ページネーション

件数が多い一覧は、ページに分けて表示します。

```ruby
PER_PAGE = 50
orders.limit(PER_PAGE).offset((page - 1) * PER_PAGE)
total_pages = (orders.count / PER_PAGE.to_f).ceil
```

ページを移動するリンクには、**いまの検索条件も付けておく** のを忘れずに（2ページ目に進んだら条件が消えた、という不具合がよくあります）。実務では `kaminari` や `pagy` などの gem もよく使われます。

## 同じアクションで HTML と JSON を返す

`respond_to` を使うと、同じ URL で、拡張子（`.json`）や `Accept` ヘッダーに応じて返す形を変えられます。

```ruby
def index
  @orders = ...
  respond_to do |format|
    format.html                                  # index.html.erb
    format.json { render json: { orders: @orders.map { |o| order_json(o) } } }
  end
end
```

`GET /admin/orders.json?status=paid` のように、**画面と同じ条件** でデータを取れます。

### JSON API の設計で気を付けること

- **返す項目を明示する**。`render json: @orders` のようにモデルをそのまま返すと、内部の項目（今後追加される項目も）が勝手に外に出てしまう
- 日時は ISO 8601 の形（`2026-04-15T10:00:00+09:00`）で返す
- 一覧には、ページの情報（`page`、`total_pages`、`total_count`）を含める
- 入力が正しくないときは、400 とエラーの理由を返す（ステータスで成功・失敗が分かるようにする）

## N+1 に気を付ける

一覧で `order.member.name` を表示すると、注文1件ごとに会員を読む SQL が実行されます（50件なら51回）。これを **N+1 問題** と呼びます。`includes(:member)` を付けると、まとめて読み込みます（上級でくわしく扱います）。
