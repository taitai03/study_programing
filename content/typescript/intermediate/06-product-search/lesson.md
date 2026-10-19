---
title: Reactで画面を作る
summary: コンポーネント、props、state、イベント、リスト表示の基本を学びます。管理画面の商品一覧に、キーワード検索とカテゴリの絞り込みを追加します。
minutes: 60
---

## コンポーネントと props

React では、画面を **コンポーネント**（部品）の組み合わせで作ります。コンポーネントは「props（引数）を受け取って、画面の要素（JSX）を返す関数」です。

```tsx
type Props = { name: string; price: number };

function ProductRow({ name, price }: Props) {
  return (
    <tr>
      <td>{name}</td>
      <td>{price.toLocaleString("ja-JP")}円</td>
    </tr>
  );
}

// 使う側
<ProductRow name="静岡煎茶 100g" price={1080} />
```

JSX の中の `{ }` には、JavaScript の式を書けます。

## リストの表示と key

配列を画面に並べるときは `map` で JSX に変えます。それぞれに **`key`**（一覧の中で変わらない、重複しない値。普通はID）を付けます。React は `key` で「どの行が、どの行に対応するか」を見分けます。

```tsx
<tbody>
  {products.map((p) => (
    <ProductRow key={p.id} name={p.name} price={p.price} />
  ))}
</tbody>
```

「0件のときはメッセージを出す」のような出し分けは、条件の式で書きます。

```tsx
{products.length === 0 ? <p>条件に合う商品はありません</p> : <ProductTable products={products} />}
```

## state とイベント

入力欄のように **画面の中で変わる値** は、`useState` で持ちます。値を変えるときは、必ず set 関数を使います（変数に直接代入しても、画面は変わりません）。

```tsx
"use client";
import { useState } from "react";

export function KeywordInput() {
  const [keyword, setKeyword] = useState("");
  return <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />;
}
```

`onChange`、`onClick`、`onSubmit` などで、ユーザーの操作（イベント）に応じた処理を書きます。フォームの送信では、`event.preventDefault()` でブラウザのページ遷移を止めてから、自分の処理を行います。

## Server Components と Client Components

Next.js（App Router）のコンポーネントは、2種類あります。

| | Server Components（何も書かない） | Client Components（`"use client"`） |
| --- | --- | --- |
| 動く場所 | サーバー | ブラウザ |
| できること | DBを直接読む、`await` で待つ | `useState`、イベント、ブラウザのAPI |
| 使いどころ | 一覧の取得と表示 | 入力欄、ボタンの操作 |

**データの取得はサーバー、操作はクライアント** に分けるのが基本です。検索なら、検索条件を **URLのクエリ**（`?q=お茶&category=2`）に入れておくと、サーバー側のページがその条件で一覧を作れます。URLに条件があると、ブラウザの戻る・進む、リロード、URLの共有でも同じ結果になります。

```tsx
// app/admin/products/page.tsx（Server Component）
export default async function Page({ searchParams }: PageProps<"/admin/products">) {
  const { q } = await searchParams;
  const products = await searchProducts(db, { q: typeof q === "string" ? q : "" });
  // ...
}
```

クライアント側で別のURLに移動するには、`next/navigation` の `useRouter` を使います。

```tsx
const router = useRouter();
router.push(`/admin/products?${new URLSearchParams({ q: "お茶" })}`);
```

## 画面のテスト（React Testing Library）

画面のテストでは、**ユーザーと同じように** 要素を探して操作します。「CSSのクラス名」ではなく、「`キーワード` というラベルの入力欄」「`検索` というボタン」で探すので、見た目を変えてもテストが壊れにくく、アクセシビリティ（ラベルが正しく付いているか）も確かめられます。

```tsx
render(<ProductFilters categories={categories} />);
await user.type(screen.getByLabelText("キーワード"), "お茶");
await user.click(screen.getByRole("button", { name: "検索" }));
```

ラベルと入力欄は、`<label htmlFor="q">` と `<input id="q">` のように結び付けておきます。
