---
title: 条件分岐で業務ルールを書く
summary: if、switch、範囲を使って、購入金額や会員ランクによって送料や割引を変える方法を学びます。
minutes: 40
---

## 条件によって処理を変える: `if`

業務のルールには「〇〇なら△△する」という条件がたくさんあります。これを書くのが `if` です。

```swift
let totalWithTax = 6000

if totalWithTax >= 5000 {
    print("送料無料です")
} else {
    print("送料は550円です")
}
```

- `if 条件 { ... }` の `{ }` の中が、条件が成り立つときに実行される部分です
- `else { ... }` の中が、成り立たないときに実行される部分です
- 条件が3つ以上あるときは `else if` をつなげます

### 比べるための記号・組み合わせる記号

| 記号 | 意味 | 例 |
| --- | --- | --- |
| `==` / `!=` | 等しい / 等しくない | `rank == "gold"` |
| `>` / `<` | より大きい / より小さい | `quantity > 10` |
| `>=` / `<=` | 以上 / 以下 | `total >= 5000` |
| `&&` | かつ | `stock >= quantity && quantity <= 10` |
| `\|\|` | または | `rank == "gold" \|\| rank == "silver"` |
| `!` | ではない | `!isPublished` |

Swift の `if` の条件は、必ず `Bool`（`true` か `false`）でなければいけません。`if quantity { ... }` のように数値をそのまま書くとエラーになります。

## 関数で結果を返す

演習では、**関数**（処理に名前を付けたもの。レッスン5で詳しく学びます）の中身を書きます。

```swift
func shippingFee(totalWithTax: Int) -> Int {
    if totalWithTax >= 5000 {
        return 0
    }
    return 550
}

print(shippingFee(totalWithTax: 6000)) // 0
```

- `-> Int` は「この関数は `Int` を返す」という意味です
- `return 値` で結果を返して、関数を終わります

## 値によって分ける: `switch`

1つの値がどれに当てはまるかで分けるときは、`switch` を使います。

```swift
func rankDiscountRate(rank: String) -> Int {
    switch rank {
    case "gold":
        return 10
    case "silver":
        return 5
    default:
        return 0
    }
}
```

- Swift の `switch` は、**考えられるすべての値** を扱わなければいけません。文字列はどんな値も来る可能性があるので、`default:`（どれにも当てはまらないとき）が必要です
- 1つの `case` が終わると、次の `case` には進みません（`break` は要りません）

## 範囲: `1...10`

「1以上10以下」のような範囲は `1...10` と書けます。「1以上10未満」は `1..<10` です。

```swift
let quantity = 3
print((1...10).contains(quantity)) // true
```

`switch` の `case` に範囲を書くこともできます。

```swift
switch totalWithTax {
case 0..<3000:
    print("あと少しでクーポンが使えます")
case 3000..<5000:
    print("クーポンが使えます")
default:
    print("送料無料です")
}
```
