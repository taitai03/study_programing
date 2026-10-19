---
title: 構造体と列挙型
summary: struct と class、値型と参照型の違い、enum を学び、商品・買い物かご・注文ステータスを型で表します。
minutes: 50
---

## データをまとめた型を作る: 構造体（struct）

これまでは、商品をタプルで表してきました。アプリの中で何度も使うデータは、**自分で型を作って** 表します。

```swift
struct Product {
    let name: String
    let price: Int // 税抜

    // 計算プロパティ: 使うたびに計算される値
    var priceWithTax: Int {
        price * 110 / 100
    }
}

let juice = Product(name: "国産りんごジュース 1L", price: 398)
print(juice.name)         // 国産りんごジュース 1L
print(juice.priceWithTax) // 437
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| 型の名前 | `Product` | 大文字で始める |
| プロパティ | `let name: String` | 型が持つ値 |
| 計算プロパティ | `var priceWithTax: Int { ... }` | ほかのプロパティから計算して返す値 |
| イニシャライザ | `Product(name: ..., price: ...)` | 型の値（インスタンス）を作る。struct は自動で用意される |

### 中身を変えるメソッド: `mutating`

構造体の中の関数（メソッド）が自分のプロパティを書き換えるときは、`mutating` を付けます。

```swift
struct Cart {
    var items: [CartItem] = []

    mutating func add(_ product: Product, quantity: Int = 1) {
        items.append(CartItem(product: product, quantity: quantity))
    }
}

var cart = Cart()   // 中身を変えるので var
cart.add(juice)
```

`let cart = Cart()` で作ると、`mutating` のメソッドは呼べません。

配列の中の要素を探して書き換えるときは、`firstIndex(where:)` で番号を探します。

```swift
if let index = items.firstIndex(where: { $0.product.name == product.name }) {
    items[index].quantity += quantity
}
```

## 値型と参照型: struct と class

Swift には、struct とよく似た **class** もあります。いちばん大きな違いは、**代入したときにコピーされるかどうか** です。

```swift
var cartA = Cart()
cartA.add(juice)
var cartB = cartA   // struct はコピーされる
cartB.add(juice)
print(cartA.items.count) // 1（cartA は変わらない）
print(cartB.items.count) // 2
```

| | struct（値型） | class（参照型） |
| --- | --- | --- |
| 代入したとき | **コピー** が作られる | **同じもの** を指す（片方を変えると、もう片方も変わる） |
| 使いどころ | 商品、金額、かごの中身など、データそのもの | 画面や通信の管理など、1つのものを共有したいとき |

class で同じことをすると、`cartB` を変えたのに `cartA` も変わります。どこで値が変わったのか追いかけるのが難しくなるので、Swift では **基本は struct を使い、共有が必要なときだけ class を使う** のが推奨されています。

## 決まった選択肢を表す: 列挙型（enum）

注文ステータスのように **決まった選択肢のどれか** を表すときは、enum を使います。

```swift
enum OrderStatus {
    case pending    // 受付
    case paid       // 支払済
    case shipped    // 発送済
    case delivered  // 完了
    case cancelled  // キャンセル
}

let status: OrderStatus = .paid
```

文字列で `"paid"` と書くと、`"payed"` のようなタイプミスをしても気づけません。enum なら、ない選択肢を書いた時点でコンパイルエラーになります。

### enum と switch

enum を `switch` で分けるときは、**すべての case を書けば `default` は要りません**。あとで選択肢を増やしたとき、書き忘れている `switch` をコンパイラが教えてくれます。

```swift
extension OrderStatus {
    var label: String {
        switch self {
        case .pending: return "受付"
        case .paid: return "支払済"
        case .shipped: return "発送済"
        case .delivered: return "完了"
        case .cancelled: return "キャンセル"
        }
    }
}
```

`self` は「その値自身」です。複数の case で同じ結果を返すときは、`case .shipped, .delivered:` のように `,` で並べられます。
