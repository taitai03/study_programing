---
title: 繰り返しとブロックで集計
summary: each / map / select / sum / group_by とブロックを使って、注文データから売上や販売数を集計します。
minutes: 45
---

## 1つずつ取り出して処理する: `each` とブロック

配列の要素を1つずつ取り出して処理するには `each` を使います。

```ruby
prices = [398, 248, 1980]

prices.each do |price|
  puts price * 110 / 100
end
# => 437
#    272
#    2178
```

`do |price| ... end` の部分を **ブロック** といいます。`each` は、配列の要素を1つずつ `price` に入れて、ブロックの中身を実行します。`|price|` の名前は自由に付けられますが、**配列の名前の単数形**（`prices` なら `price`、`orders` なら `order`）にするのが読みやすい書き方です。

ブロックが1行で済むときは、`{ }` で書くこともできます。

```ruby
prices.each { |price| puts price }
```

### 合計を求める

`each` で合計を求めるには、合計を入れる変数を先に作っておき、1つずつ足していきます。

```ruby
total = 0
prices.each do |price|
  total += price
end
p total # => 2626
```

## よく使うデータ処理のメソッド

Rubyには、`each` で書ける処理を1行で書けるメソッドがたくさんあります。現場のRubyのコードでは、こちらのほうがよく使われます。

### 合計する: `sum`

```ruby
p [398, 248, 1980].sum # => 2626

items = [
  { product_name: "国産りんごジュース 1L", unit_price: 398, quantity: 3 },
  { product_name: "ふっくら食パン", unit_price: 248, quantity: 2 },
]
# ブロックを渡すと、ブロックの結果を合計する
p items.sum { |item| item[:unit_price] * item[:quantity] } # => 1690
```

### 条件に合うものだけ残す: `select` / 除く: `reject`

```ruby
orders = [
  { id: 1, status: :paid },
  { id: 2, status: :cancelled },
  { id: 3, status: :shipped },
]

p orders.select { |order| order[:status] == :paid }      # => [{ id: 1, status: :paid }]
p orders.reject { |order| order[:status] == :cancelled } # => id 1 と 3 の注文
```

ブロックの結果が `true` になった要素だけを残した（`reject` は除いた）、**新しい配列** を返します。もとの配列は変わりません。

### 1つずつ変換する: `map`

```ruby
p orders.map { |order| order[:id] } # => [1, 2, 3]
```

ブロックの結果を集めた新しい配列を返します。

### 種類ごとに分ける: `group_by`

```ruby
p orders.group_by { |order| order[:status] }
# => { paid: [{ id: 1, ... }], cancelled: [{ id: 2, ... }], shipped: [{ id: 3, ... }] }
```

ブロックの結果をキーにしたハッシュを返します。値は、そのキーになった要素の配列です。

## 種類ごとに数える

「商品ごとの販売数」のように種類ごとに数えるときは、**最初の値を 0 にしたハッシュ** を使うと簡単です。

```ruby
counts = Hash.new(0) # まだないキーを取り出すと 0 が返るハッシュ

items.each do |item|
  counts[item[:product_name]] += item[:quantity]
end
p counts # => { "国産りんごジュース 1L" => 3, "ふっくら食パン" => 2 }
```

`Hash.new(0)` で作ったハッシュは、まだないキーの値が `0` になります。そのため、初めて出てきた商品でも、いきなり `+=` で足せます。キーに文字列を使ったハッシュは `"国産りんごジュース 1L" => 3` のように `=>` で表示されます。

### 繰り返しの中で繰り返す

注文の中に明細が入っているときは、`each` の中でもう一度 `each` を使います。

```ruby
orders.each do |order|
  order[:items].each do |item|
    # 1つ1つの明細に対する処理
  end
end
```

`flat_map` を使うと、すべての注文の明細を1つの配列にまとめることもできます。

```ruby
all_items = orders.flat_map { |order| order[:items] }
```
