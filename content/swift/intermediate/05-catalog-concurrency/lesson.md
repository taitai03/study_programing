---
title: Swift Concurrency
summary: async / await、Task、actor の入門、キャンセルを学びます。商品一覧と在庫情報を並列で取得してまとめます。
minutes: 60
---

## async / await

通信のように時間のかかる処理は、`async` の関数にします。呼び出すときは `await` を付け、結果が返るまで待ちます（待っている間、画面は固まりません）。

```swift
func fetchProducts() async throws -> [Product] { ... }

let products = try await api.fetchProducts()
```

`async` の関数は、`async` の関数の中か、`Task { }` の中からしか呼べません。SwiftUI では `.task { }` 修飾子の中で呼ぶのが一般的です（画面が消えると自動でキャンセルされます）。

## 並列に実行する: async let

互いに関係のない2つの通信を順番に `await` すると、待ち時間は2つの合計になります。

```swift
let products = try await productAPI.fetchProducts() // 0.3秒
let stocks = try await stockAPI.fetchAllStock()     // 0.3秒 → 合計 0.6秒
```

`async let` を使うと、**両方を先に始めて**、あとでまとめて待てます。

```swift
async let products = productAPI.fetchProducts()
async let stocks = stockAPI.fetchAllStock()
let result = try await (products, stocks)           // 合計 0.3秒
```

数が決まっていない処理（商品ごとの画像など）を並列にするときは、`withThrowingTaskGroup` を使います。

## 一部の失敗をどう扱うか

並列に取得するとき、**片方が失敗したら全体を失敗にするのか** を、業務の都合で決めます。

- 商品が取れない → 一覧を表示できないので、エラーにする
- 在庫だけ取れない → 商品は表示して、在庫は「不明」にする（在庫のサーバーの不調で、お店全体が見られなくなるのは困る）

「不明」は `nil`（オプショナル）で表します。「在庫0」と「不明」は意味が違うので、`0` で代用しません。

## actor でデータを守る

複数の処理が **同時に** 同じ変数を書き換えると、値が壊れることがあります（データ競合）。**actor** は、中の変数に同時に1つの処理しか触れないようにしてくれる型です。

```swift
actor CatalogLoader {
    private(set) var cachedItems: [CatalogItem]?

    func load() async throws -> [CatalogItem] {
        if let cachedItems { return cachedItems }
        ...
        cachedItems = items
        return items
    }
}

let items = try await loader.load()   // actor の外からは await を付けて呼ぶ
```

- actor のメソッドやプロパティは、外からは `await` を付けて使う（順番待ちになることがあるため）
- `class` と同じく参照型。`struct` のようにコピーされない

## キャンセル

画面を閉じたときなど、もう結果が要らない処理は **キャンセル** されます。キャンセルされても処理は自動では止まらないので、**キャンセルに協力する** 書き方をします。

- `Task.sleep` や `URLSession` は、キャンセルされると `CancellationError` を投げる
- 自分の処理の区切りで `try Task.checkCancellation()` を呼ぶと、キャンセルされていれば `CancellationError` を投げる
- `catch` でエラーを全部握りつぶすと、キャンセルも消えてしまう。`CancellationError` は投げ直す

```swift
do {
    return try await stockAPI.fetchAllStock()
} catch is CancellationError {
    throw CancellationError()   // キャンセルは伝える
} catch {
    return nil                  // それ以外の失敗は「不明」にする
}
```

キャンセルされた読み込みの途中の結果を、キャッシュに残してはいけません。
