---
title: 条件分岐で業務ルールを書く
summary: if / unless / case を使って、会員ランクや金額によって処理を変える方法を学びます。
minutes: 40
---

## 条件によって処理を変える: `if`

業務のルールには「〇〇なら△△する」という条件がたくさんあります。これを書くのが `if` です。

```ruby
total_with_tax = 6000

if total_with_tax >= 5000
  puts "送料無料です"
else
  puts "送料は550円です"
end
```

- `if 条件` の次の行から `end` までが、条件が成り立つときに実行される部分です
- `else` から `end` までが、成り立たないときに実行される部分です
- 中の行は2文字下げて（インデントして）書きます。どこからどこまでが `if` の中かが見て分かるようにするためです

条件が3つ以上あるときは `elsif` を使います（`elseif` ではないので注意）。

```ruby
if rank == "gold"
  rate = 10
elsif rank == "silver"
  rate = 5
else
  rate = 0
end
```

### 比べるための記号

| 記号 | 意味 | 例 |
| --- | --- | --- |
| `==` | 等しい | `rank == "gold"` |
| `!=` | 等しくない | `status != "cancelled"` |
| `>` / `<` | より大きい / より小さい | `quantity > 10` |
| `>=` / `<=` | 以上 / 以下 | `total >= 5000` |

`=` は「変数に値を入れる」、`==` は「等しいか比べる」です。混同しないようにしましょう。

### 条件を組み合わせる

| 記号 | 意味 | 例 |
| --- | --- | --- |
| `&&` | かつ（両方成り立つ） | `stock >= quantity && quantity <= 10` |
| `\|\|` | または（どちらかが成り立つ） | `rank == "gold" \|\| rank == "silver"` |
| `!` | ではない | `!published` |

### 範囲: `1..10`

「1以上10以下」のような範囲は、`1..10` と書けます。`(1..10).include?(quantity)` で、値が範囲に入っているかを調べられます。

## 「〇〇でなければ」: `unless`

`unless` は `if` の反対で、条件が **成り立たないとき** に実行します。

```ruby
unless published
  puts "この商品は非公開です"
end
```

1行で済む処理は、うしろに条件を付けて書くこともできます（後置 if / unless）。

```ruby
return 0 if total >= 5000
puts "在庫がありません" unless in_stock
```

ただし `unless` に `else` を付けたり、`unless` の条件に `!` を入れたりすると読みにくくなります。そういうときは `if` を使いましょう。

## 値によって分ける: `case`

1つの値がどれに当てはまるかで分けるときは、`case` を使うとすっきり書けます。

```ruby
case rank
when "gold"
  10
when "silver"
  5
else
  0
end
```

`when` には範囲も書けます。

```ruby
case quantity
when 1..10
  "受け付けます"
else
  "受け付けられません"
end
```

## メソッドは最後の値を返す

演習では、`def` で作られた **メソッド**（処理に名前を付けたもの。レッスン6で詳しく学びます）の中身を書きます。Rubyのメソッドは、**最後に実行した式の値** を結果として返します。`if` や `case` も値を返すので、次のように書けます。

```ruby
def shipping_fee(total_with_tax)
  if total_with_tax >= 5000
    0
  else
    550
  end
end
```

途中で結果を返して終わりにしたいときは `return` を使います。

### `?` で終わるメソッド

`true` か `false` を返すメソッドには、名前の最後に `?` を付けるのがRubyの習慣です（`empty?` や `include?` など）。演習の `can_accept_order?` もその1つです。
