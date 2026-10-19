---
title: モデルとデータベース
summary: マイグレーション、Active Record、バリデーション、関連付けを学びます。商品にレビュー機能のモデルを追加します。
minutes: 60
---

## マイグレーションでテーブルを作る

テーブルの追加や変更は、**マイグレーション**（DBを変更する Ruby のファイル）で行います。ファイルは `db/migrate/` に置き、順番に当てていきます。

```bash
bin/rails generate model Review product:references member:references rating:integer body:text
```

```ruby
class CreateReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :reviews do |t|
      t.references :product, null: false, foreign_key: true   # product_id と外部キー制約
      t.references :member, null: false, foreign_key: true
      t.integer :rating, null: false
      t.text :body
      t.timestamps                                              # created_at と updated_at
    end
    add_index :reviews, %i[member_id product_id], unique: true  # 組み合わせを一意にする
  end
end
```

```bash
bin/rails db:migrate   # 当てる。db/schema.rb が更新される
bin/rails db:rollback  # 1つ戻す（書き間違えたとき）
```

**`db/migrate/` のファイルと `db/schema.rb` の両方を commit します**。テストやほかの人の環境は `schema.rb` からテーブルを作ります。

## 制約は DB とモデルの両方に

| 守りたいこと | モデル（バリデーション） | DB（制約） |
| --- | --- | --- |
| 必須 | `validates :rating, presence: true` | `null: false` |
| 一意 | `validates :member_id, uniqueness: { scope: :product_id }` | `add_index ..., unique: true` |
| 関連先がある | `belongs_to`（標準で必須） | `foreign_key: true` |

モデルのバリデーションは **分かりやすいエラーメッセージ** を出すため、DBの制約は **最後の砦** です。同時に2つのリクエストが来たときなど、バリデーションをすり抜けるケースでも、DBの制約がデータを守ります。

## バリデーション

```ruby
class Review < ApplicationRecord
  validates :rating, presence: true,
                     numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :body, length: { maximum: 1000 }
  validate :member_must_have_purchased   # 独自のルール

  private
    def member_must_have_purchased
      errors.add(:base, "購入した商品だけレビューできます") unless purchased?
    end
end
```

- `valid?` でバリデーションを実行し、`errors` にエラーが入る
- `save` は失敗すると `false`、`save!` / `create!` は例外を投げる
- 項目に関係しないエラーは `errors.add(:base, "...")` に入れる

エラーメッセージは `config/locales/` の翻訳で日本語になります（このアプリは `rails-i18n` を使っています）。項目名の日本語は `config/locales/models.ja.yml` に書きます。

## 関連付け

```ruby
class Product < ApplicationRecord
  has_many :reviews, dependent: :destroy   # 商品を削除したら、レビューも削除する
end

class Review < ApplicationRecord
  belongs_to :product
  belongs_to :member
end

product.reviews               # 商品のレビューの一覧
product.reviews.create!(...)  # 商品に紐付いたレビューを作る
review.product                # レビューの商品
```

`dependent:` は、親を削除したときに子をどうするかを決めます。`:destroy`（子も削除）、`:restrict_with_error`（子があれば削除できない）などがあります。

## 集計

```ruby
product.reviews.average(:rating)  # 平均（SQL の AVG）。レコードがなければ nil
product.reviews.count             # 件数（SQL の COUNT）
```

`average` の結果は `BigDecimal` です。表示やJSONに使うときは `round(1)` や `to_f` で整えます。`nil` のときに備えて `&.`（ぼっち演算子）を使います。

```ruby
reviews.average(:rating)&.round(1)&.to_f
```

## 別のテーブルを使ったルール

「購入した商品だけレビューできる」のように、別のテーブルを見るルールは、関連をたどって検索します。

```ruby
OrderItem.joins(:order).merge(Order.for_sales).where(product:, orders: { member_id: member.id }).exists?
```

`joins` で結合し、`merge` でほかのモデルのスコープ（キャンセル以外）を組み合わせ、`exists?` で「1件でもあるか」を確かめます（全件を読み込まないので速い）。
