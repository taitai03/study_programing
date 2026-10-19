---
title: クラスでデータと処理をまとめる
summary: クラス、インスタンス、initialize、attr_reader を学び、商品クラスと買い物かごクラスを作って合計金額を計算します。
minutes: 50
---

## データと処理をひとまとめにする: クラス

これまでは、商品をハッシュで表し、計算はメソッドで行ってきました。

```ruby
product = { name: "国産りんごジュース 1L", price: 398 }
price_with_tax(product[:price])
```

データが増えてくると、「この計算はどのデータに使うものか」が分かりにくくなります。そこで、**データと、そのデータに対する処理をひとまとめにする** のがクラスです。

```ruby
class Product
  attr_reader :name, :price

  def initialize(name:, price:)
    @name = name
    @price = price
  end

  def price_with_tax
    price * 110 / 100
  end
end

juice = Product.new(name: "国産りんごジュース 1L", price: 398)
p juice.name           # => "国産りんごジュース 1L"
p juice.price_with_tax # => 437
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| クラス名 | `Product` | 大文字で始め、単語の区切りも大文字にする（`ShoppingCart`） |
| インスタンス | `Product.new(...)` で作ったもの | クラスという「型紙」から作った、1つ1つの商品 |
| `initialize` | `def initialize(name:, price:)` | `new` したときに最初に実行されるメソッド。受け取った値を保存する |
| インスタンス変数 | `@name` | `@` で始まる変数。インスタンスごとに値を持ち、クラスの中のどのメソッドからでも使える |
| `attr_reader` | `attr_reader :name, :price` | `@name` を外から `juice.name` で読めるようにする |

### `attr_reader` がないとどうなるか

インスタンス変数は、そのままではクラスの外から読めません。`attr_reader` を書き忘れると、`juice.name` で `NoMethodError: undefined method 'name'` になります。`attr_reader :name` は、次のメソッドを書いたのと同じ意味です。

```ruby
def name
  @name
end
```

値を外から書き換えられないようにしておく（読むだけにする）と、どこで値が変わったのかを追いかけずに済みます。

## インスタンスが状態を持つ: 買い物かご

買い物かごは、商品を入れるたびに中身が変わります。中身をインスタンス変数に持たせます。

```ruby
class Cart
  def initialize
    @quantities = Hash.new(0) # 商品 => 数量
  end

  def add(product, quantity = 1)
    @quantities[product] += quantity
  end

  def item_count
    @quantities.values.sum
  end
end

cart = Cart.new
cart.add(juice, 2)
cart.add(juice) # 同じ商品は数量が増える
p cart.item_count # => 3
```

- `cart.add(...)` のように、インスタンスに対してメソッドを呼び出します
- 同じ商品のインスタンスをハッシュのキーにすると、同じ行にまとまります
- `@quantities.each do |product, quantity| ... end` のように、ハッシュの `each` ではキーと値の2つを受け取れます

### 同じクラスのメソッドを呼ぶ

クラスの中のメソッドから、同じクラスの別のメソッドは、そのまま名前で呼び出せます。

```ruby
def total
  total_with_tax + shipping_fee
end
```

### 正しくない値をはじく: `raise`

業務では、ありえない値（数量が0個やマイナスなど）を受け付けてしまうと、あとで大きな問題になります。おかしな値を渡されたら、その場でエラーにします。

```ruby
def add(product, quantity = 1)
  raise ArgumentError, "数量は1以上にしてください" if quantity < 1

  @quantities[product] += quantity
end
```

`raise エラーの種類, "メッセージ"` で、エラーを発生させます。引数がおかしいときは `ArgumentError` を使うのが一般的です。
