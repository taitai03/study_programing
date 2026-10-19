---
title: オプショナル
summary: 値がないかもしれないことを表すオプショナルと、nil・if let・guard let・?? を学びます。アプリがクラッシュする原因を防ぎます。
minutes: 45
---

## 値がないかもしれない: オプショナル

業務のデータには、**値が入っていないことがある** 項目がたくさんあります。会員がニックネームを登録していない、クーポンを使っていない、入力欄が空のまま送られてきた、などです。

Swift では、値がないことを `nil` で表します。そして、**`nil` になるかもしれない値** には、型の後ろに `?` を付けます。これを **オプショナル** といいます。

```swift
var nickname: String? = nil     // まだ登録されていない
nickname = "はなこ"              // あとから登録された

let points: Int? = nil
```

`String` と `String?` は **別の型** です。`String?` の値は、そのままでは `String` として使えません。

```swift
let nickname: String? = "はなこ"
let message = "こんにちは、" + nickname // エラー: value of optional type 'String?' must be unwrapped
```

このおかげで、「値がないのに使ってしまってアプリがクラッシュする」という、とてもよくある不具合を、**実行する前に** 防げます。

### オプショナルが返ってくる場面

| 場面 | 例 | 型 |
| --- | --- | --- |
| 辞書から取り出す | `stock["天然水 2L"]` | `Int?`（キーがないかもしれない） |
| 文字列を数値に変換する | `Int("3")` | `Int?`（`"abc"` は数値にできない） |
| 配列の最初の要素 | `prices.first` | `Int?`（配列が空かもしれない） |

## 中身を取り出す方法

### 代わりの値を使う: `??`

`a ?? b` は、`a` が `nil` なら `b` を使います。

```swift
let points: Int? = nil
print("\(points ?? 0) pt") // 0 pt
```

### 値があるときだけ使う: `if let`

```swift
let nickname: String? = "はなこ"

if let nickname {
    print("こんにちは、\(nickname)さん") // この中では nickname は String
} else {
    print("こんにちは、ゲストさん")
}
```

`if let 名前 { ... }` は、値が `nil` でなければ中身を取り出して `{ }` の中を実行します。中では、オプショナルではない普通の値として使えます。`if let name = member.name { ... }` のように、別の名前で取り出すこともできます。

### 値がなければ先に抜ける: `guard let`

```swift
func parseQuantity(_ text: String) -> Int? {
    guard let quantity = Int(text) else {
        return nil // 数値にできなければ、ここで終わる
    }
    // ここから下では quantity は Int として使える
    return quantity
}
```

`guard let ... else { ... }` は、値が `nil` なら `else` の中で関数を抜けます。**おかしな値を先にはじいて、本来の処理を下に書く** ので、条件が増えても読みやすくなります。`guard` の条件には、`guard let quantity = Int(text), quantity > 0 else { ... }` のように `,` で条件を続けられます。

## 使ってはいけない: `!`

オプショナルの後ろに `!` を付けると、中身を強制的に取り出せます。

```swift
let quantity = Int("abc")!  // nil なので、ここでアプリがクラッシュする
```

`nil` だったときに **アプリがクラッシュ** します。「絶対に nil にならない」と言い切れる場面以外では使わず、`if let`、`guard let`、`??` を使いましょう。現場のコードレビューでも、`!` はよく指摘されます。
