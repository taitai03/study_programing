---
title: SwiftUIで画面を作る
summary: View、@State、リスト表示と、ロジックを ViewModel に分ける方法を学びます。商品一覧画面にカテゴリの絞り込みを追加します。
minutes: 60
---

## SwiftUI の View

SwiftUI では、画面を **View**（`body` で見た目を返す構造体）の組み合わせで作ります。データが変わると、SwiftUI が自動で `body` を作り直して画面を更新します。

```swift
struct ProductRow: View {
    let product: Product

    var body: some View {
        HStack {
            Text(product.name)
            Spacer()
            Text(formatYen(product.price))
        }
    }
}
```

### リストの表示

`List` と `ForEach` で、配列を一覧にします。要素が `Identifiable`（`id` を持つ）なら、そのまま渡せます。

```swift
List {
    ForEach(products) { product in
        ProductRow(product: product)
    }
}
```

## 状態（State）

画面の中で変わる値は、**状態** として持ちます。

| 書き方 | 使いどころ |
| --- | --- |
| `@State private var quantity = 1` | その View だけで使う、小さな値（入力中の数量、シートの表示など） |
| `@State private var viewModel = ProductListViewModel(...)` | `@Observable` のクラス（ViewModel）を、その View が持つ |
| `@Environment(FavoritesStore.self) var favorites` | アプリ全体で共有するもの（上の View から渡される） |

`@Observable` を付けたクラスのプロパティを `body` の中で読むと、SwiftUI はその値が変わったときに画面を更新します（Observation）。

## ロジックを ViewModel に分ける

「どの商品を表示するか」「どのカテゴリがあるか」のような **判断（ロジック）** を View の中に書くと、画面を動かさないと確かめられません。ロジックは **ViewModel** に分け、View は「ViewModel の値を表示する」「操作を ViewModel に伝える」だけにします。

```swift
@MainActor
@Observable
public final class ProductListViewModel {
    public private(set) var selectedCategory: String?

    public var filteredProducts: [Product] {
        guard let selectedCategory else { return products }
        return products.filter { $0.category == selectedCategory }
    }

    public func select(category: String?) { ... }
}
```

```swift
// View は表示と、操作の受け渡しだけ
ForEach(viewModel.filteredProducts) { product in ... }
Button("飲料") { viewModel.select(category: "飲料") }
```

- ViewModel は `SwiftUI` を import しない。だから **Linux でもテストできる**（このアプリの判定は Linux の `swift test`）
- 画面の更新は SwiftUI と同じスレッドで行うので、ViewModel には `@MainActor` を付ける
- 外から勝手に変えられたくない値は `public private(set)` にして、変更はメソッド経由にする（ルールを1か所で守れる）

### 状態から計算できる値は、保存しない

`filteredProducts` や `categories` は、`products` と `selectedCategory` から **計算** できます。別の変数に保存すると、読み込み直したときに更新し忘れて食い違います。計算型プロパティにしておけば、いつも正しい値になります。

## View の部品化

1つの `body` が長くなったら、意味のある単位で別の View に分けます。部品に必要な値と操作は、引数（プロパティとクロージャ）で受け取ります。

```swift
struct CategoryPicker: View {
    let categories: [String]
    let selected: String?
    let onSelect: (String?) -> Void
    var body: some View { ... }
}
```

Xcode の **プレビュー**（`#Preview`）を使うと、アプリを起動せずに部品の見た目を確かめられます。
