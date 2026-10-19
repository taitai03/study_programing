---
title: Next.jsでAPIとDBを扱う
summary: App Router の構成、Route Handlers、REST の基本、Drizzle によるDBアクセスを学びます。注文一覧APIに「期間」と「ステータス」の絞り込みを追加します。
minutes: 60
---

## App Router のフォルダ構成

Next.js（App Router）では、`src/app/` の **フォルダ構成がそのままURLになります**。

| ファイル | URL | 役割 |
| --- | --- | --- |
| `app/admin/orders/page.tsx` | `/admin/orders` | 画面 |
| `app/admin/orders/[id]/page.tsx` | `/admin/orders/123` | `[id]` の部分が変わる画面 |
| `app/api/orders/route.ts` | `/api/orders` | API（Route Handler） |
| `app/admin/layout.tsx` | `/admin` 以下すべて | 共通の枠（ヘッダーなど） |

## Route Handlers で API を作る

`route.ts` で、HTTP のメソッド名（`GET`、`POST` など）の関数を export すると、APIになります。引数は Web 標準の `Request`、戻り値は `Response` です。

```ts
// app/api/orders/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // ?status=paid
  // ...
  return Response.json({ orders });
}
```

## REST の基本

APIは、**URL で「何を」、メソッドで「どうするか」** を表します。

| メソッドとURL | 意味 |
| --- | --- |
| `GET /api/orders` | 注文の一覧を取得する |
| `GET /api/orders?status=paid` | 条件で絞り込んだ一覧を取得する |
| `GET /api/orders/123` | 注文123を取得する |
| `POST /api/orders` | 注文を作る |
| `PATCH /api/orders/123` | 注文123の一部を変更する |

一覧の絞り込みや並べ替え、ページの指定は、**クエリ文字列**（`?` のあと）で受け取るのが一般的です。クエリの値はすべて **文字列** で届き、ユーザーが自由に書き換えられるので、必ず形を確かめます（前のレッスンの zod が使えます）。

## Drizzle で条件を組み立てる

Drizzle ORM では、SQL の条件を関数で組み立てます。

```ts
import { and, eq, gte, lt } from "drizzle-orm";

db.select()
  .from(orders)
  .where(and(eq(orders.status, "paid"), gte(orders.createdAt, from), lt(orders.createdAt, until)))
  .orderBy(desc(orders.createdAt))
  .limit(50)
  .offset(50); // 2ページ目
```

| 関数 | SQL |
| --- | --- |
| `eq(列, 値)` | `列 = 値` |
| `gte` / `gt` / `lte` / `lt` | `>=` / `>` / `<=` / `<` |
| `and(...)` / `or(...)` | `AND` / `OR` |

**条件が指定されたときだけ絞り込む** ときは、条件の配列を作って、最後に `and(...条件)` にします。`and()` に何も渡さないと `undefined` になり、絞り込みなしになります。

```ts
const conditions: SQL[] = [];
if (status) conditions.push(eq(orders.status, status));
if (from) conditions.push(gte(orders.createdAt, from));
db.select().from(orders).where(and(...conditions));
```

## 「日付」で絞り込むときの注意

DBには日時（UTC）が入っていて、画面やAPIでは日本時間の **日付** で指定されます。

- `2026-04-01` は、日本時間の **4月1日 0:00**（= UTC の 3月31日 15:00）から
- 「4月15日まで」は、4月15日の 23:59:59 **まで** ではなく、**4月16日 0:00 より前** と書く（ミリ秒の取りこぼしがなく、シンプル）

```ts
const from = new Date("2026-04-01T00:00:00+09:00");
const until = new Date("2026-04-16T00:00:00+09:00"); // to=2026-04-15 の翌日
// from <= createdAt < until
```

`new Date("2026-02-30")` は3月2日になってしまうなど、**JavaScript の Date は存在しない日付を黙って別の日にずらします**。入力の日付は、変換したあとに元の文字列と同じ日付になっているかも確かめます。

## マイグレーション

テーブルの形（列の追加など）を変えるときは、`src/db/schema.ts` を変えて **マイグレーション**（DBを変更するSQL）を作ります。

```bash
npm run db:generate   # schema.ts との差分から drizzle/ にSQLを作る
npm run db:migrate    # 手元のDBに当てる
```

できたSQLのファイルは commit します。ほかの人やテストのDBにも、同じ変更が順番に当たります（総まとめの課題で使います）。
