---
title: プロトコルと拡張
summary: protocol、extension、プロトコル指向の考え方を学びます。支払い方法（カード、コンビニ、後払い）ごとの手数料計算をプロトコルで表します。
minutes: 50
---

## プロトコルは「できること」の約束

**プロトコル** は、型が持つべきプロパティやメソッドを決める「約束」です。中身（どう計算するか）は書かず、**何ができるか** だけを決めます。

```swift
protocol PaymentMethod {
    var name: String { get }
    func fee(for amount: Int) -> Int
}
```

型がプロトコルに **準拠** すると、その約束を守る（プロパティとメソッドを持つ）必要があります。

```swift
struct CreditCardPayment: PaymentMethod {
    let name = "クレジットカード"
    func fee(for amount: Int) -> Int { 0 }
}

struct DeferredPayment: PaymentMethod {
    let name = "後払い"
    func fee(for amount: Int) -> Int { 330 }
}
```

## なぜプロトコルを使うのか

支払い方法ごとの手数料を `switch` で書くこともできます。

```swift
func fee(method: String, amount: Int) -> Int {
    switch method {
    case "card": 0
    case "convenience": amount < 10_000 ? 220 : 330
    case "deferred": 330
    default: 0
    }
}
```

この書き方では、支払い方法が増えるたびに、手数料・上限・表示名など **あちこちの switch を直す** 必要があり、直し忘れが起きます。プロトコルにすると、**1つの支払い方法のことは1つの型にまとまり**、新しい支払い方法は型を1つ足すだけで済みます。使う側は、具体的な型を知らなくても `PaymentMethod` として扱えます。

```swift
let methods: [any PaymentMethod] = [CreditCardPayment(), DeferredPayment()]
for method in methods {
    print(method.name, method.fee(for: 12_000))
}
```

`any PaymentMethod` は「PaymentMethod に準拠している何らかの型」を表します。

## extension で機能を足す

**extension**（拡張）は、既存の型に機能を足します。プロトコルを拡張すると、**準拠するすべての型** で使えるメソッドを書けます。

```swift
extension PaymentMethod {
    func totalWithFee(for amount: Int) -> Int {
        amount + fee(for: amount)
    }
}

DeferredPayment().totalWithFee(for: 12_000) // 12330
```

### デフォルトの実装

プロトコルの要件に、extension で **デフォルトの実装** を用意すると、準拠する型は書かなくてもよくなります。必要な型だけが自分の値で上書きします。

```swift
protocol PaymentMethod {
    var maxAmount: Int? { get }   // 要件として宣言しておく
}

extension PaymentMethod {
    var maxAmount: Int? { nil }   // 書かなければ「上限なし」
}

struct ConvenienceStorePayment: PaymentMethod {
    let maxAmount: Int? = 300_000 // 上書きする
}
```

要件として **プロトコルの本体に宣言しておく** のがポイントです。宣言せずに extension にだけ書くと、`any PaymentMethod` として使ったときに、型ごとの値ではなく extension の値が使われてしまいます。

## プロトコル指向の考え方

Swift では、クラスの継承よりも **プロトコルと extension の組み合わせ** で共通の振る舞いを作ることが多くあります（プロトコル指向）。

- `struct`（値型）でも使える（継承は `class` だけ）
- 1つの型が、複数のプロトコルに準拠できる
- テストでは、本物の代わりに **プロトコルに準拠した偽物** を渡せる（中級4、5で使います）

標準ライブラリの `Equatable`（`==` で比べられる）、`Codable`（JSON に変換できる）、`Identifiable`（ID を持つ）も、すべてプロトコルです。
