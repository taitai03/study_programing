---
title: 定数・変数と型
summary: let と var、型推論、String / Int / Double / Bool の4つの型を学び、商品の税込価格と付与ポイントを計算します。
minutes: 40
---

## 値に名前を付ける: `let` と `var`

同じ値を何度も使うときや、値の意味を分かりやすくしたいときは、名前を付けて保存します。

```swift
let price = 398
let quantity = 3
print(price * quantity) // 1194
```

- `let` で作ったものは **定数** で、あとから値を変えられません
- `var` で作ったものは **変数** で、あとから値を変えられます

```swift
var total = 0
total = total + 1000
total += 500 // total = total + 500 と同じ
print(total) // 1500
```

**基本は `let` を使い、値を変える必要があるときだけ `var` を使う** のが現場の書き方です。`let` で作った値を変えようとすると、`cannot assign to value: 'price' is a 'let' constant` というエラーになります。また、`var` で作ったのに一度も変えていないと、Xcode が「`let` にしましょう」と警告してくれます。

名前は `totalWithTax` のように、2つめ以降の単語の先頭を大文字にしてつなげます（キャメルケースといいます）。

## 値には「型」がある

Swift のすべての値には **型**（値の種類）があります。

| 型 | 意味 | 例 |
| --- | --- | --- |
| `Int` | 整数 | `398`、`-100` |
| `Double` | 小数 | `1.1`、`0.5` |
| `String` | 文字列 | `"国産りんごジュース 1L"` |
| `Bool` | 真偽値（はい / いいえ） | `true`、`false` |

`let price = 398` のように書くと、Swift が値から型を自動で決めてくれます（**型推論**）。型をはっきり書くこともできます。

```swift
let price: Int = 398
let productName: String = "国産りんごジュース 1L"
let isPublished: Bool = true
```

### 違う型どうしは、そのままでは計算できない

Swift は型に厳しい言語です。`Int` と `Double` は、そのままでは一緒に計算できません。

```swift
let price = 398       // Int
let rate = 1.1        // Double
let total = price * rate // エラー: binary operator '*' cannot be applied to operands of type 'Int' and 'Double'
```

型を変換するときは `Double(price)` や `Int(...)` のように書きます。この厳しさのおかげで、「整数のつもりが小数になっていた」といった間違いを、実行する前に見つけられます。

## お金の計算は整数（Int）で行う

税込価格を `Double` で計算すると、コンピューターの小数の計算で **ごくわずかな誤差** が出ることがあります。

```swift
print(0.1 + 0.2) // 0.30000000000000004
```

お金の計算で誤差が出ると、1円ずれた請求になってしまいます。そこで現場では、**小数を使わず整数で計算する** のが基本です。消費税10%なら、「110を掛けて100で割る」と書きます。

```swift
let subtotal = 1194
let totalWithTax = subtotal * 110 / 100
print(totalWithTax) // 1313
```

Swift では、**`Int` どうしの割り算は、小数点以下が切り捨てられます**。さくらマートでは端数はすべて切り捨てるルールなので、整数で計算すればそのままルールどおりになります。

割り算の順番にも気をつけましょう。`subtotal / 100 * 110` と書くと、先に `1194 / 100` が `11` に切り捨てられてしまいます。**掛け算を先に、割り算をあとに** するのがコツです。
