---
title: 関数とクロージャ
summary: 引数ラベル、戻り値、デフォルト引数と、クロージャを使った map / filter を学び、仕様書に書かれたクーポンのルールを白紙から関数として書きます。
minutes: 50
---

## 処理に名前を付ける: 関数

これまでの演習で中身を書いてきた `func ...` が **関数** です。

```swift
func priceWithTax(price: Int) -> Int {
    return price * 110 / 100
}

print(priceWithTax(price: 398)) // 437
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| 関数名 | `priceWithTax` | 何をするかが分かる名前にする |
| 引数（ひきすう） | `price: Int` | 呼び出すときに渡す値と、その型 |
| 戻り値の型 | `-> Int` | 返す値の型。何も返さないときは書かない |

関数の中身が1つの式だけなら、`return` を省略できます。

```swift
func priceWithTax(price: Int) -> Int {
    price * 110 / 100
}
```

## 引数ラベル

Swift では、呼び出すときに **引数の名前（ラベル）を書く** のが基本です。`priceWithTax(price: 398)` のように、読んだだけで何を渡しているかが分かります。

ラベルは、関数の中で使う名前と分けることもできます。

```swift
// 呼び出すときは for、中では product という名前で使う
func stockCount(for product: String) -> Int { ... }
stockCount(for: "天然水 2L")

// _ にすると、呼び出すときにラベルを書かない
func priceWithTax(_ price: Int) -> Int { ... }
priceWithTax(398)
```

`_` は、ラベルがなくても意味が明らかなときだけ使います。

### デフォルト引数

引数に `= 値` を付けると、呼び出すときに省略できます。

```swift
func lineTotal(unitPrice: Int, quantity: Int = 1) -> Int {
    unitPrice * quantity
}
lineTotal(unitPrice: 398)              // 398
lineTotal(unitPrice: 398, quantity: 3) // 1194
```

### 小さいほう・大きいほう

`min(a, b)` は小さいほう、`max(a, b)` は大きいほうを返します。「割引額は金額を超えない」のような上限のあるルールで便利です。

## 関数を値として渡す: クロージャ

**クロージャ** は、名前のない小さな関数です。`{ }` で書き、ほかの関数に渡して使います。配列の `map` や `filter` でよく使います。

```swift
let prices = [398, 248, 1980]

// map: 1つずつ変換した新しい配列を作る
let withTax = prices.map { price in price * 110 / 100 }
print(withTax) // [437, 272, 2178]

// filter: 条件に合うものだけを残した新しい配列を作る
let expensive = prices.filter { price in price >= 1000 }
print(expensive) // [1980]
```

- `{ price in ... }` の `price` は、クロージャが受け取る値の名前です。`in` のあとに処理を書きます
- クロージャの中が1つの式なら、その値が結果になります

### `$0` を使った短い書き方

受け取る値の名前を省略して、`$0`（1つめの値）と書くこともできます。

```swift
let withTax = prices.map { $0 * 110 / 100 }
```

短く書けますが、処理が長くなると何の値か分かりにくくなります。迷ったら名前を付けましょう。

### タプルの配列にも使える

```swift
let products: [(name: String, price: Int)] = [
    (name: "国産りんごジュース 1L", price: 398),
    (name: "竹のまな板", price: 1980),
]
let names = products.filter { $0.price < 1000 }.map { $0.name }
print(names) // ["国産りんごジュース 1L"]
```

`filter` のあとに `map` をつなげて、「条件に合うものだけを、名前に変換する」と書けます。
