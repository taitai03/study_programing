---
title: 配列とハッシュ
summary: 複数の値をまとめる配列と、項目名と値の組をまとめるハッシュ、項目名に使うシンボルを学びます。注文データから必要な項目を取り出します。
minutes: 40
---

## 複数の値を並べる: 配列

商品の一覧や注文の一覧のように、複数の値を並べて扱うときは **配列** を使います。`[ ]` の中に、値を `,` で区切って書きます。

```ruby
product_names = ["国産りんごジュース 1L", "ふっくら食パン", "竹のまな板"]

p product_names[0]    # => "国産りんごジュース 1L"（先頭は 0 番）
p product_names[2]    # => "竹のまな板"
p product_names[-1]   # => "竹のまな板"（-1 は最後）
p product_names[10]   # => nil（存在しない番号）
p product_names.first # => "国産りんごジュース 1L"
p product_names.size  # => 3
```

- 番号（インデックス）は **0から数えます**。1番目の要素は `[0]` です
- 存在しない番号を指定すると、エラーではなく `nil`（何もない、を表す値）が返ります

要素を追加するには `<<` を使います。

```ruby
product_names << "天然水 2L"
p product_names.size # => 4
```

## 項目名と値の組: ハッシュ

1つの商品には、名前・価格・在庫数など、いくつもの項目があります。こうした「項目名と値の組」をまとめるのが **ハッシュ** です。

```ruby
product = { name: "国産りんごジュース 1L", price: 398, stock: 12 }

p product[:name]  # => "国産りんごジュース 1L"
p product[:price] # => 398
p product[:color] # => nil（ない項目）

product[:stock] = 11 # 値を書き換える
product[:published] = true # 項目を追加する
```

`name:` や `:name` の部分は **シンボル** といいます。シンボルは、**名前を表すための値** です。ハッシュの項目名（キー）には、ふつうシンボルを使います。

| 書き方 | 意味 |
| --- | --- |
| `{ name: "りんご" }` | キーが `:name`、値が `"りんご"` のハッシュ |
| `product[:name]` | キー `:name` の値を取り出す |
| `:gold` | `gold` という名前を表すシンボル。会員ランクや注文ステータスのような「種類」を表すのにも使う |

文字列の `"gold"` とシンボルの `:gold` は **別の値** です。`"gold" == :gold` は `false` になるので、データでどちらを使っているかを確認しましょう。

## 配列とハッシュを組み合わせる

実際の業務データは、ハッシュの中に配列やハッシュが入った形をしています。

```ruby
order = {
  id: 1024,
  customer: { name: "山田 花子", rank: :gold },
  items: [
    { product_name: "国産りんごジュース 1L", unit_price: 398, quantity: 3 },
    { product_name: "竹のまな板", unit_price: 1980, quantity: 1 },
  ],
}

p order[:customer][:name]              # => "山田 花子"
p order[:items].size                   # => 2
p order[:items][1][:product_name]      # => "竹のまな板"
```

外側から順に `[ ]` をつなげて、目的の値までたどります。

### 途中で nil になるかもしれないとき: `dig`

`order[:items][0][:product_name]` は、`items` が空の配列だと `order[:items][0]` が `nil` になり、`nil[:product_name]` で `NoMethodError` になってしまいます。

`dig` を使うと、途中で `nil` になったらエラーにせず `nil` を返してくれます。

```ruby
p order.dig(:items, 0, :product_name) # => "国産りんごジュース 1L"

empty_order = { id: 1025, items: [] }
p empty_order.dig(:items, 0, :product_name) # => nil（エラーにならない）
```

### 値がないときの代わりの値: `||`

`a || b` は、`a` が `nil`（または `false`）なら `b` を返します。「値がなければ代わりにこれを使う」ときに便利です。

```ruby
coupon = nil
p coupon || "なし" # => "なし"
```

## 対応表としてのハッシュ

ハッシュは「この値なら、これ」という対応表としても使えます。`if` や `case` をたくさん並べる代わりに、ハッシュから取り出すだけで済みます。

```ruby
RANK_LABELS = { general: "一般", silver: "シルバー", gold: "ゴールド" }

p RANK_LABELS[:gold] # => "ゴールド"
```
