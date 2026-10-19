---
title: クラス設計と例外
summary: module と include、例外の発生と捕捉、独自の例外クラスを学びます。在庫の引き当て処理に、在庫不足のときの例外を追加します。
minutes: 50
---

## module と include

**module** は、メソッドや定数をまとめる入れ物です。クラスと違って、インスタンスは作れません。主な使い方は2つです。

1. **名前空間**: 関係するクラスや定数をまとめる（`Pricing::TAX_RATE`、`StockAllocator::InsufficientStockError`）
2. **Mix-in**: `include` すると、module のメソッドをクラスのインスタンスメソッドとして使える

```ruby
module Stockable
  LOW_STOCK_THRESHOLD = 10

  def in_stock?(quantity = 1)
    stock >= quantity          # include したクラスの stock を使う
  end
end

class Product < ApplicationRecord
  include Stockable
end

product.in_stock?(3)
```

「在庫を持つ」という性質を module にしておくと、あとで「セット商品」など別のクラスにも同じ振る舞いを足せます。Rails では、こうした module を `app/models/concerns/` に置きます。

継承（`<`）は「〜の一種」（`InsufficientStockError` は `StandardError` の一種）、include は「〜という性質を持つ」と考えると使い分けやすくなります。

## 例外を投げる・受け止める

処理を続けられない問題が起きたら、**例外** を投げます（`raise`）。呼び出し元は `rescue` で受け止めて、エラーの表示などに変えます。

```ruby
def allocate!
  raise InsufficientStockError, "在庫が足りません" if product.stock < quantity
  # ...
end

begin
  allocator.allocate!
rescue StockAllocator::InsufficientStockError => e
  puts e.message
end
```

メソッドの中なら `begin` を書かずに、メソッドの最後に `rescue` を書けます。

```ruby
def allocate_stock!(lines)
  StockAllocator.new(lines).allocate!
rescue StockAllocator::InsufficientStockError => e
  raise Error, e.message      # 呼び出し元が扱う例外に変える
end
```

### 戻り値で false を返すのではだめ？

`allocate` が失敗したときに `false` を返す書き方もありますが、呼び出し元が戻り値を確かめ忘れると、**在庫が足りないのに注文が作られます**。例外なら、受け止めない限り処理が止まるので、確かめ忘れが起きません。業務のルールに反する状態は、例外で止めるのが安全です。

## 独自の例外クラス

`raise "在庫が足りません"`（`RuntimeError`）でも止められますが、**独自の例外クラス** を作ると次の利点があります。

- `rescue InsufficientStockError` のように、**その問題だけ** を受け止められる（ほかのバグまで握りつぶさない）
- 問題の詳細（どの商品が、いくつ足りないか）を **属性として持たせられる**。画面やAPIで使える

```ruby
class InsufficientStockError < StandardError
  attr_reader :product, :requested, :available

  def initialize(product:, requested:, available:)
    @product = product
    @requested = requested
    @available = available
    super("「#{product.name}」の在庫が足りません（注文: #{requested}個、在庫: #{available}個）")
  end
end
```

独自の例外は **`StandardError` を継承** します。`rescue => e`（クラスを書かない rescue）は `StandardError` とその子だけを受け止めるためです（`Exception` を直接継承すると、`rescue => e` で受け止められません）。

## 確かめてから変える

在庫の引き当てで、明細を1つずつ「確かめて減らす」を繰り返すと、2つ目で在庫が足りなかったときに **1つ目だけ減った状態** が残ります。

1. まず **すべての** 明細を確かめる
2. 問題がなければ、すべてを変える

さらに、注文の作成全体を `transaction` の中で行っておくと、途中で例外が起きたときに、それまでのDBの変更がすべて取り消されます。
