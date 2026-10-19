---
title: ファイルとデータの集計
summary: Ruby の CSV ライブラリと Enumerable（group_by、sum、each_with_object）でデータを集計します。経理から依頼された売上CSVを出力するスクリプトを作ります。
minutes: 60
---

## Enumerable で集計する

Ruby の配列やハッシュには、**Enumerable** というモジュールのメソッドがたくさんあります。業務のデータ処理は、これらを組み合わせると短く、読みやすく書けます。

| メソッド | すること |
| --- | --- |
| `select` / `reject` | 条件に合うものを残す / 除く |
| `map` | 1つずつ別の形に変える |
| `sum` | 合計する（ブロックで合計する値を指定できる） |
| `group_by` | ブロックの値ごとにグループに分けて、ハッシュにする |
| `sort_by` | ブロックの値で並べる |
| `each_with_object` | 入れ物（ハッシュなど）を持ち回りながら集計する |

```ruby
lines.reject { |l| l.status == "cancelled" }
     .group_by(&:product_id)                          # { 1 => [明細, 明細], 10 => [明細] }
     .map { |id, group| { product_id: id, sales: group.sum { |l| l.unit_price * l.quantity } } }
     .sort_by { |r| -r[:sales] }                      # 売上の多い順（マイナスを付けて逆順）
```

複数の条件で並べるときは、`sort_by { |r| [r[:month], -r[:sales], r[:product_id]] }` のように **配列** を返します。配列は先頭の要素から順に比べられます。

### group_by のキーを複数にする

「月ごと・商品ごと」のように複数の項目でグループにするときは、キーを配列にします。

```ruby
lines.group_by { |l| [l.month, l.product_id] }
# { ["2026-04", 1] => [...], ["2026-04", 10] => [...] }
```

ブロックの引数を `|(month, product_id), group|` と書くと、キーの配列を分解して受け取れます。

## Data でデータの形を決める

`Data.define` は、決まった項目を持つ、変更できない値の型を作ります（Ruby 3.2 から）。ハッシュより、項目名の間違いにすぐ気づけます。

```ruby
OrderLine = Data.define(:order_id, :ordered_at, :quantity)
line = OrderLine.new(order_id: 1, ordered_at: Time.now, quantity: 2)
line.quantity # => 2
```

## CSV を読み書きする

CSV は「カンマで区切るだけ」に見えますが、値にカンマや改行が入るときはダブルクォートで囲む、などのルールがあります。`line.split(",")` では正しく読めないので、**CSV ライブラリ** を使います。

```ruby
require "csv"

rows = CSV.parse(text, skip_blanks: true)       # 行ごとの文字列の配列
csv = CSV.generate do |out|
  out << %w[month product_id product_name]
  out << ["2026-04", 1, "カタログギフト 5,000円コース"]   # 必要に応じて自動でダブルクォートで囲む
end
```

CSV ライブラリは、Ruby 3.3 までは標準で入っていましたが、**Ruby 3.4 からは gem として Gemfile に書く** 必要があります。

```ruby
# Gemfile
gem "csv"
```

```bash
bundle install   # Gemfile.lock も更新される。両方を commit する
```

## 文字列を数値・日時にする

| 書き方 | 変換できないとき |
| --- | --- |
| `"12".to_i` | `"abc".to_i` は `0`（エラーにならない） |
| `Integer("12", 10)` | `ArgumentError` |
| `Time.iso8601("2026-03-31T15:00:00Z")` | `ArgumentError` |

外から来たデータの変換に `to_i` を使うと、壊れた値が黙って `0` になります。**エラーにしたいときは `Integer()` を使い、`rescue` して「何行目の、どの値が悪いか」が分かるエラーにします**。

## タイムゾーン

`2026-03-31T15:00:00Z` は UTC で、日本時間では **4月1日の0時** です。月別の集計は、日本時間に直してから月を取り出します。Rails では `in_time_zone("Tokyo")` が使えます（このアプリは `config.time_zone = "Tokyo"`）。

```ruby
Time.iso8601("2026-03-31T15:00:00Z").in_time_zone("Tokyo").strftime("%Y-%m") # => "2026-04"
```

## Rake タスクで実行する

アプリのモデルやライブラリを使うスクリプトは、Rake タスクにすると `bin/rails` から実行できます（`lib/tasks/*.rake`）。`ENV["INPUT"]` のように、環境変数で引数を受け取れます。

```bash
bin/rails reports:monthly_sales INPUT=data/order-lines-sample.csv OUTPUT=output/monthly-sales.csv
```
