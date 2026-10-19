---
title: オブジェクトとデータ処理
summary: 商品や注文のような「いくつもの項目を持つデータ」をオブジェクトで扱い、条件で抜き出したり、種類ごとに数えたりします。
minutes: 45
---

## いくつもの項目をまとめる: オブジェクト

1つの商品には、名前・価格・カテゴリ・在庫数など、いくつもの項目があります。これを1つにまとめるのが **オブジェクト** です。

```ts
const product = {
  name: "国産りんごジュース 1L",
  price: 398,
  category: "飲料",
  stock: 12,
};

console.log(product.name);  // 国産りんごジュース 1L
console.log(product.price); // 398
```

`{ 項目名: 値, ... }` で作り、`オブジェクト.項目名` で値を取り出します。項目のことを **プロパティ** と呼びます。

## オブジェクトの配列

業務で扱うデータの多くは「オブジェクトの配列」です。商品一覧、注文一覧、会員一覧…すべてこの形です。

```ts
const products = [
  { name: "国産りんごジュース 1L", price: 398, category: "飲料", stock: 12 },
  { name: "ふっくら食パン", price: 248, category: "食品", stock: 0 },
  { name: "竹のまな板", price: 1980, category: "キッチン用品", stock: 5 },
];

for (const product of products) {
  console.log(`${product.name}: 在庫 ${product.stock}`);
}
```

## データの形を決める: `type`

TypeScriptでは、オブジェクトがどんなプロパティを持つかを `type` で決めておけます（詳しくは次のレッスンで学びます）。

```ts
type Product = {
  name: string;     // 文字列
  price: number;    // 数値
  category: string;
  stock: number;
  published: boolean; // true か false
};

function isOutOfStock(product: Product): boolean {
  return product.stock === 0;
}
```

## よく使うデータ処理のパターン

### 条件に合うものを抜き出す

```ts
const names: string[] = [];
for (const product of products) {
  if (product.stock === 0) {
    names.push(product.name); // 配列の最後に追加する
  }
}
```

空の配列を用意して、条件に合うものを `push` で追加していきます。

### 種類ごとに数える

カテゴリごとの商品数のように「種類ごとに数える」ときは、オブジェクトを **表** として使います。

```ts
const counts: Record<string, number> = {};
for (const product of products) {
  const current = counts[product.category] ?? 0;
  counts[product.category] = current + 1;
}
console.log(counts); // { "飲料": 1, "食品": 1, "キッチン用品": 1 }
```

- `Record<string, number>` は「項目名が文字列、値が数値のオブジェクト」という型です
- `counts[product.category]` のように `[ ]` を使うと、変数に入っている名前のプロパティを読み書きできます
- `?? 0` は「値がまだない（`undefined`）なら 0 を使う」という意味です。そのカテゴリを初めて数えるときに使われます

## JSON

APIやファイルでやりとりされるデータは、多くの場合 **JSON** という形式です。JSONは、ここで学んだオブジェクトと配列の書き方とほとんど同じです。つまり、オブジェクトの配列を扱えるようになれば、実際のシステムのデータを扱えるようになります。
