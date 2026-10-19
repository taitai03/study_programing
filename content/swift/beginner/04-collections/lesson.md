---
title: 配列・辞書と繰り返し
summary: Array、Dictionary、for-in を使って、注文の一覧から売上合計と商品別の販売数を出します。
minutes: 45
---

## 複数の値を並べる: 配列（Array）

商品の一覧や注文の一覧のように、複数の値を並べて扱うときは **配列** を使います。

```swift
var productNames = ["国産りんごジュース 1L", "ふっくら食パン", "竹のまな板"]

print(productNames[0])    // 国産りんごジュース 1L（先頭は 0 番）
print(productNames.count) // 3
productNames.append("天然水 2L") // 最後に追加する（var で作った配列だけ）
```

- 配列の型は `[String]`（`String` の配列）のように書きます
- 番号（インデックス）は **0から数えます**
- **存在しない番号を指定すると、アプリがクラッシュします**（`Index out of range`）。番号で取り出すときは、`count` を確かめてからにしましょう

## 1つずつ取り出す: `for-in`

```swift
let prices = [398, 248, 1980]
var total = 0

for price in prices {
    total += price
}
print(total) // 2626
```

`for 名前 in 配列 { ... }` と書くと、配列の要素を1つずつ取り出して `{ }` の中を実行します。名前は配列の名前の単数形（`prices` なら `price`）にすると読みやすくなります。

`for` の中で `continue` と書くと、その要素の処理を飛ばして次の要素に進みます。

## 名前付きの組: タプル

1つの明細のように、いくつかの値をまとめたいときは **タプル** が使えます（もっと本格的な方法はレッスン7の構造体で学びます）。

```swift
let line = (productName: "国産りんごジュース 1L", unitPrice: 398, quantity: 3)
print(line.productName)              // 国産りんごジュース 1L
print(line.unitPrice * line.quantity) // 1194
```

タプルの配列にすれば、表のようなデータを扱えます。

```swift
let lines: [(productName: String, unitPrice: Int, quantity: Int)] = [
    (productName: "国産りんごジュース 1L", unitPrice: 398, quantity: 3),
    (productName: "ふっくら食パン", unitPrice: 248, quantity: 2),
]
for line in lines {
    print("\(line.productName): \(line.unitPrice * line.quantity)円")
}
```

## キーと値の組: 辞書（Dictionary）

「商品名 → 販売数」のように、キーで値を引くときは **辞書** を使います。

```swift
var stock: [String: Int] = ["天然水 2L": 30, "ふっくら食パン": 0]

print(stock["天然水 2L"])  // Optional(30)
stock["竹のまな板"] = 5    // 追加・書き換え
```

- 辞書の型は `[キーの型: 値の型]` と書きます
- 辞書から取り出した値は、**キーがないかもしれない** ので `Optional(30)` のような形（オプショナル）になります。オプショナルはレッスン6で詳しく学びます

### 種類ごとに数える: `default:`

種類ごとに数えるときは、`[キー, default: 0]` と書くと、まだないキーを 0 として扱えます。

```swift
var counts: [String: Int] = [:] // 空の辞書

for line in lines {
    counts[line.productName, default: 0] += line.quantity
}
print(counts["国産りんごジュース 1L", default: 0]) // 3
```

辞書には **順番がありません**。`print(counts)` で表示される順番は、実行するたびに変わることがあります。順番が必要なときは、配列に変換して並べ替えます。
