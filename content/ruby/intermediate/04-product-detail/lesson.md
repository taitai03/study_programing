---
title: Railsの全体像
summary: MVC、ルーティング、コントローラー、ビュー、rails console、ログの見方を学びます。さくらマートの管理画面に商品詳細ページを追加します。
minutes: 60
---

## リクエストが画面になるまで

ブラウザで `/admin/products/12` を開いたとき、Rails の中では次の順に処理が進みます。

```mermaid
flowchart LR
  A[ブラウザ] -->|GET /admin/products/12| B[ルーティング<br/>config/routes.rb]
  B --> C[コントローラー<br/>Admin::ProductsController#show]
  C --> D[モデル<br/>Product.find(12)]
  D --> E[(DB)]
  C --> F[ビュー<br/>admin/products/show.html.erb]
  F -->|HTML| A
```

これを **MVC**（Model・View・Controller）と呼びます。

| 役割 | 場所 | すること |
| --- | --- | --- |
| Model | `app/models/` | データと業務のルール（DBとのやりとり、計算） |
| View | `app/views/` | 画面（HTML）を作る |
| Controller | `app/controllers/` | リクエストを受けて、モデルを呼び、ビューに渡す |

## ルーティング

`config/routes.rb` で、URL とコントローラーのアクションを結び付けます。

```ruby
namespace :admin do
  resources :products, only: %i[index show]
end
```

| HTTP と URL | コントローラー#アクション | URL を作るヘルパー |
| --- | --- | --- |
| `GET /admin/products` | `admin/products#index` | `admin_products_path` |
| `GET /admin/products/:id` | `admin/products#show` | `admin_product_path(product)` |

`bin/rails routes` で、いまのルーティングの一覧を確認できます。

## コントローラーとビュー

```ruby
class Admin::ProductsController < Admin::BaseController
  def show
    @product = Product.includes(:category).find(params[:id])
  end
end
```

- URL の `:id` の部分は `params[:id]` で受け取る
- `@` で始まる変数（インスタンス変数）は、ビューから使える
- アクションの最後に何も書かなければ、`app/views/admin/products/show.html.erb` が表示される
- `find` は見つからないと `ActiveRecord::RecordNotFound` になり、本番では 404 のページになる

ビュー（ERB）では、`<%= %>` で値を出力し、`<% %>` で Ruby のコードを実行します。出力は自動でエスケープされるので、商品名に `<script>` が含まれていても安全です。

```erb
<h1><%= @product.name %></h1>
<%= link_to "← 商品一覧", admin_products_path %>
```

### 計算はモデルに書く

「税込の価格」「累計の販売数」のような計算は、ビューに直接書かずに **モデルのメソッド** にします。ほかの画面やAPIでも同じ計算を使え、テストもしやすくなります。

```ruby
class Product < ApplicationRecord
  def price_with_tax
    price + price * Pricing::TAX_RATE / 100
  end
end
```

## rails console

`bin/rails console` を実行すると、アプリのモデルを対話的に使えます。DBの中身を見たり、書いたメソッドを試したりするのに便利です。

```ruby
product = Product.find(1)
product.order_items.count
Order.where(status: "cancelled").count
```

## ログの見方

`bin/rails server` を実行しているターミナル（または `log/development.log`）には、リクエストごとに次のような情報が出ます。

```
Started GET "/admin/products/12" for ::1 at 2026-04-15 10:00:00 +0900
Processing by Admin::ProductsController#show as HTML
  Parameters: {"id" => "12"}
  Product Load (0.1ms)  SELECT "products".* FROM "products" WHERE "products"."id" = ? LIMIT ?  [["id", 12], ["LIMIT", 1]]
  Rendered admin/products/show.html.erb within layouts/admin (Duration: 2.3ms)
Completed 200 OK in 15ms
```

- **どのコントローラーのどのアクション** が呼ばれたか
- **パラメーター**（URL やフォームから来た値）
- **実行された SQL**
- **結果のステータス**（200、302、404、500 など）

画面が思ったとおりに動かないときは、まずログを見て「どこまで処理が進んだか」を確かめます。エラーのときは、ログにエラーの種類と、どのファイルの何行目で起きたかが出ます。

## リクエストのテスト

画面のテストは、**リクエストスペック**（`type: :request`）で書きます。実際に URL にリクエストを送り、ステータスや HTML の中身を確かめます。

```ruby
RSpec.describe "管理画面: 商品詳細", type: :request do
  before { sign_in_as(create(:user)) }

  it "商品名を表示する" do
    product = create(:product, name: "静岡煎茶 100g")
    get admin_product_path(product)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("静岡煎茶 100g")
  end
end
```
