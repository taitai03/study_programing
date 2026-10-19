---
title: 高階関数でデータを扱う
summary: ジェネリクス、map / filter / reduce / compactMap、並べ替えを学びます。注文履歴を月別にまとめ、合計金額の多い順に並べます。
minutes: 60
---

## 高階関数

**高階関数** は、関数（クロージャ）を引数に受け取る関数です。配列の変換や集計は、`for` 文の代わりに高階関数を組み合わせて書くと、「何をしたいか」が読み取りやすくなります。

| 関数 | すること | 例 |
| --- | --- | --- |
| `filter` | 条件に合うものだけ残す | キャンセルを除く |
| `map` | 1つずつ別の形に変える | 注文 → 合計金額 |
| `compactMap` | 変換して、`nil` になったものは捨てる | 文字列 → 数値（変換できないものは無視） |
| `flatMap` | 変換した配列をつなげて1つにする | 注文の配列 → 明細の配列 |
| `reduce` | 1つの値にまとめる | 合計 |
| `sorted(by:)` | 並べ替える | 金額の多い順 |

```swift
let total = orders
    .filter { $0.status != .cancelled }
    .map(\.total)              // キーパスも関数として渡せる
    .reduce(0, +)

let ids = ["#123", "abc", "456"].compactMap { Int($0.replacingOccurrences(of: "#", with: "")) } // [123, 456]
```

### グループに分ける

`Dictionary(grouping:by:)` は、キーごとに要素をまとめた辞書を作ります。

```swift
let byStatus = Dictionary(grouping: orders, by: \.status)   // [OrderStatus: [PastOrder]]
```

辞書の `map` は `(key, value)` の組を受け取ります。結果は配列になるので、最後に並べ替えます（辞書には順番がありません）。

### 複数の条件で並べる

`sorted(by:)` のクロージャは「`$0` を `$1` より先にするなら `true`」を返します。複数の条件はタプルで比べると簡潔に書けます。タプルは先頭の要素から順に比べられます。

```swift
totals.sorted { ($0.total, $0.month) > ($1.total, $1.month) } // 合計の多い順、同じなら月の新しい順
```

昇順と降順が混ざるときは、条件を分けて書きます。

```swift
items.sorted { $0.quantity != $1.quantity ? $0.quantity > $1.quantity : $0.productID < $1.productID }
```

### 長いつなぎ方で型エラーが出たら

高階関数を長くつなぐと、`the compiler is unable to type-check this expression in reasonable time` というエラーが出ることがあります。Swift の型推論が複雑になりすぎたときのエラーです。途中の結果を `let` に入れて **型を書いて** 分けると解決します。読みやすさの面でも、1つの式は数行に収めるのがおすすめです。

```swift
let items: [PastOrderItem] = orders.filter { $0.status != .cancelled }.flatMap(\.items)
let quantities: [ProductQuantity] = items.grouped(by: \.productID).map { ... }
```

## ジェネリクス

「合計する」処理は、要素が注文でも明細でも、合計する値が `Int` でも `Double` でも同じです。型の部分を **型パラメーター**（`<Value>`）にすると、どんな型でも使える関数を1つ書けます。これが **ジェネリクス** です。

```swift
extension Sequence {
    func sum<Value: AdditiveArithmetic>(of value: (Element) -> Value) -> Value {
        reduce(.zero) { $0 + value($1) }
    }
}

orders.sum { $0.total }   // Int
[0.5, 1.25].sum { $0 }    // Double
```

- `<Value: AdditiveArithmetic>` は「足し算ができて、ゼロがある型なら何でもよい」という **制約**
- `Element` は `Sequence` の要素の型（配列なら中身の型）
- `extension Sequence` に書くと、配列にもセットにも使える

標準ライブラリの `Array<Element>`、`Dictionary<Key, Value>`、`Optional<Wrapped>` も、ジェネリクスで作られています。

## 日付で集計するときの注意

`Date` は「ある瞬間」を表すだけで、タイムゾーンを持ちません。「何月か」は、**どのタイムゾーンのカレンダーで数えるか** で変わります（UTC の 3月31日 15時は、日本時間では 4月1日）。年月を取り出すときは、日本時間のカレンダーを使います。

```swift
let components = Calendar.japan.dateComponents([.year, .month], from: order.orderedAt)
```
