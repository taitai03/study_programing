---
title: TypeScriptの型
summary: 型を付けると何が防げるのかを学びます。型エラーを読んで、実行する前にバグを見つけて直します。
minutes: 45
---

## 型は「データの約束」

これまで `price: number` や `type Product = { ... }` のように、値に **型** を付けてきました。型は「この値はこういう形をしている」という約束です。

TypeScriptは、この約束が守られているかを **実行する前に** チェックしてくれます。約束が破られているところには赤い波線が引かれ、型エラーになります。

```ts
type OrderItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
};

function calcItemTotal(item: OrderItem): number {
  return item.price * item.quantity;
  //          ~~~~~ Property 'price' does not exist on type 'OrderItem'.
}
```

`OrderItem` には `price` ではなく `unitPrice` があるので、型エラーになります。型がなければ、このコードは実行できてしまい、計算結果が `NaN`（数値ではない）になるバグとして、本番で初めて見つかったかもしれません。

**型エラーは、実行する前に見つかったバグです。** 現場では、型エラーが残ったままのコードはリリースしません。

## 型の書き方

### 基本の型

| 型 | 意味 | 例 |
| --- | --- | --- |
| `string` | 文字列 | `"ふっくら食パン"` |
| `number` | 数値 | `248` |
| `boolean` | 真偽値 | `true` / `false` |
| `string[]` | 文字列の配列 | `["飲料", "食品"]` |

### オブジェクトの型: `type` と `interface`

```ts
type Member = {
  id: number;
  name: string;
};

// interface でもほぼ同じことができる
interface Member2 {
  id: number;
  name: string;
}
```

どちらを使ってもかまいません。プロジェクトの中でどちらかに揃えるのが一般的です。

### 決まった値だけを許す: ユニオン型

会員ランクは `"general"`、`"silver"`、`"gold"` のどれかです。`string` にすると、どんな文字列でも入ってしまいます。

```ts
type MemberRank = "general" | "silver" | "gold";

function getRankDiscountRate(rank: MemberRank): number {
  if (rank === "glod") return 10;
  //  ~~~~~~~~~~~~~~ This comparison appears to be unintentional because the types
  //                 '"general" | "silver" | "gold"' and '"glod"' have no overlap.
  return 0;
}
```

`|` で並べると「このどれか」という型になります。ありえない値と比べているので、タイプミスが型エラーとして見つかります。

### あってもなくてもよい: オプショナル

```ts
type Order = {
  id: number;
  couponCode?: string; // ? を付けると、なくてもよい
};
```

`couponCode?: string` は「文字列か、`undefined`（値がない）」という意味です。値がないかもしれないものをそのまま使おうとすると、型エラーになります。

```ts
function formatCoupon(order: Order): string {
  return order.couponCode.toUpperCase();
  //     ~~~~~~~~~~~~~~~~ 'order.couponCode' is possibly 'undefined'.
}
```

値がない場合を先に処理すると、型エラーが消えます。

```ts
function formatCoupon(order: Order): string {
  if (order.couponCode === undefined) {
    return "クーポン: なし";
  }
  return `クーポン: ${order.couponCode.toUpperCase()}`;
}
```

## 型エラーの読み方

型エラーのメッセージは英語ですが、よく出るものは決まっています。

| メッセージ | 意味 |
| --- | --- |
| `Property 'xxx' does not exist on type 'Yyy'` | `Yyy` に `xxx` というプロパティはない（名前の間違い） |
| `Type 'string' is not assignable to type 'number'` | 数値が必要なところに文字列を入れている |
| `'xxx' is possibly 'undefined'` | 値がないかもしれないのに、そのまま使っている |
| `This comparison appears to be unintentional ...` | ありえない値と比べている（タイプミスなど） |

エラーの出た行と、メッセージに出てくる **名前** を見比べるのがコツです。
