---
title: 画面からデータを登録・更新する
summary: フォーム、Strong Parameters、フラッシュメッセージ、エラーの表示を学びます。管理画面から商品の登録・編集・非公開化ができるようにします。
minutes: 60
---

## 登録・更新の流れ

Rails の画面からデータを登録・更新するときは、決まった流れがあります。

| 操作 | HTTP と URL | アクション | 成功 | 失敗 |
| --- | --- | --- | --- | --- |
| 登録画面 | `GET /admin/products/new` | `new` | | |
| 登録 | `POST /admin/products` | `create` | 一覧などに **リダイレクト** | `new` を **422** で表示し直す |
| 編集画面 | `GET /admin/products/:id/edit` | `edit` | | |
| 更新 | `PATCH /admin/products/:id` | `update` | リダイレクト | `edit` を 422 で表示し直す |

```ruby
def create
  @product = Product.new(product_params)
  if @product.save
    redirect_to admin_products_path, notice: "「#{@product.name}」を登録しました"
  else
    render :new, status: :unprocessable_content
  end
end
```

- 成功したら **リダイレクト** する。そのまま画面を返すと、ブラウザのリロードで同じ登録がもう一度送られてしまう
- 失敗したら、**入力した値とエラーを持った @product** で、フォームを表示し直す。ステータスは 422（Turbo が「失敗した送信」として扱うために必要）

## フォーム

`form_with model:` は、モデルが新しいか（`new_record?`）で、送信先（POST か PATCH）とボタンの文言を自動で切り替えます。登録と編集で同じフォームを **パーシャル**（`_form.html.erb`）にして使い回します。

```erb
<%= form_with model: [:admin, product] do |form| %>
  <%= form.label :name %>
  <%= form.text_field :name %>
  <%= form.collection_select :category_id, Category.order(:id), :id, :name, include_blank: "選んでください" %>
  <%= form.submit %>
<% end %>
```

入力欄の `name` は `product[name]` のようになり、コントローラーでは `params[:product][:name]` で受け取ります。

## Strong Parameters

フォームから来た値を、そのまま `Product.new(params[:product])` に渡すことはできません。ブラウザの開発者ツールを使えば、**フォームにない項目も送れる** からです（`product[id]`、管理者フラグなど）。これを **Mass Assignment の脆弱性** と呼びます。

Rails では、受け付ける項目を明示的に許可します（**Strong Parameters**）。

```ruby
def product_params
  params.expect(product: %i[name description price stock category_id published])
end
```

`params.expect`（Rails 8）は、`product` のハッシュがなければ 400 を返し、許可した項目だけを取り出します（それまでは `params.require(:product).permit(...)` と書いていました）。

## フラッシュメッセージ

`redirect_to ..., notice: "..."` で渡したメッセージは、**次の1回のリクエスト** だけで読める `flash` に入ります。レイアウトで表示しておけば、どの画面でも「登録しました」のようなメッセージを出せます。

```erb
<% if notice %><p class="flash flash-notice"><%= notice %></p><% end %>
```

## エラーの表示

バリデーションに失敗した `@product` の `errors` には、項目ごとのエラーが入っています。

```erb
<% if product.errors.any? %>
  <div class="errors" role="alert">
    <ul>
      <% product.errors.full_messages.each do |message| %>
        <li><%= message %></li>   <%# 例: 商品名を入力してください %>
      <% end %>
    </ul>
  </div>
<% end %>
```

`full_messages` は、項目名（`config/locales/models.ja.yml`）とメッセージをつなげた文になります。

## 削除の代わりに「非公開」

商品には注文の履歴が紐付いているので、削除すると過去の注文が壊れます。業務のデータは、削除より **状態を変える**（非公開にする、無効にする）ことが多くあります。`resources` に独自のアクションを足すときは `member` を使います。

```ruby
resources :products, only: %i[index new create edit update] do
  member do
    patch :unpublish   # PATCH /admin/products/:id/unpublish
  end
end
```

ボタンでPATCHを送るには `button_to "非公開にする", unpublish_admin_product_path(product), method: :patch` を使います。
