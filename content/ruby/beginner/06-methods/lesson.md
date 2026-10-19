---
title: メソッドにまとめる
summary: メソッドの定義、引数、戻り値、キーワード引数を学び、仕様書に書かれたクーポンのルールを白紙からメソッドとして書きます。
minutes: 45
---

## 処理に名前を付ける: メソッド

これまでの演習で中身を書いてきた `def ... end` が **メソッド** です。決まった処理に名前を付けておくと、何度でも呼び出して使えます。

```ruby
def price_with_tax(price)
  price * 110 / 100
end

p price_with_tax(398)  # => 437
p price_with_tax(1980) # => 2178
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| メソッド名 | `price_with_tax` | 小文字と `_` で、何をするかが分かる名前にする |
| 引数（ひきすう） | `price` | 呼び出すときに渡す値。メソッドの中では変数として使える |
| 戻り値 | `price * 110 / 100` | 最後に実行した式の値が、呼び出した側に返る |

メソッドの中で作った変数は、メソッドの外からは見えません。メソッドに必要な値は、引数で受け取ります。

### 引数がいくつもあるとき

```ruby
def line_total(unit_price, quantity)
  unit_price * quantity
end

p line_total(398, 3) # => 1194
```

### 省略できる引数

引数に `= 値` を付けると、呼び出すときに省略できます（省略したときの値をデフォルト値といいます）。

```ruby
def line_total(unit_price, quantity = 1)
  unit_price * quantity
end

p line_total(398)    # => 398
p line_total(398, 3) # => 1194
```

## 引数に名前を付ける: キーワード引数

引数が増えてくると、`coupon_discount(3000, :amount, 500, 2000)` のような呼び出しは、どの数字が何なのか分からなくなります。そこで、**引数に名前を付けて渡す** キーワード引数を使います。

```ruby
def coupon_discount(amount, type:, value:, min_purchase: 0)
  # ...
end

coupon_discount(3000, type: :amount, value: 500, min_purchase: 2000)
coupon_discount(3000, type: :percent, value: 10) # min_purchase は省略できる
```

- `type:` のように `:` で終わる引数がキーワード引数です。呼び出すときも `type: :amount` のように名前を付けて渡します
- `min_purchase: 0` のように値を書いたものは省略でき、省略すると `0` になります
- 値を書いていないもの（`type:` `value:`）は **必須** です。渡さないと `ArgumentError: missing keyword: :type` になります
- 名前で渡すので、`value: 500, type: :amount` のように順番を入れ替えてもかまいません

### メソッドからメソッドを呼ぶ

大きな処理は、小さなメソッドに分けて、組み合わせて作ります。

```ruby
def rank_discount_rate(rank)
  { gold: 10, silver: 5 }.fetch(rank, 0)
end

def amount_after_rank_discount(subtotal, rank:)
  subtotal - subtotal * rank_discount_rate(rank) / 100
end
```

`hash.fetch(キー, 代わりの値)` は、キーがなければ代わりの値を返します。

### 小さいほう・大きいほう

2つの値のうち小さいほうは `[a, b].min`、大きいほうは `[a, b].max` で求められます。「割引額は金額を超えない」のような上限のあるルールで便利です。

```ruby
p [500, 300].min # => 300
```

## 仕様書からメソッドを作るときの手順

1. **メソッドの形を先に書く**: 名前と引数を書き、中身は仮の値（`0` など）を返すだけにして、エラーなく動くことを確かめる
2. **仕様を1つずつ書く**: 仕様書の箇条書きを1つずつコードにする。1つ書くたびに `p` で確かめる
3. **境目の値を試す**: 「2,000円以上」なら 1,999円と2,000円の両方で確かめる
