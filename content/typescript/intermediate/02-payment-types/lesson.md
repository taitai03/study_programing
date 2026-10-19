---
title: 型で外部データを扱う
summary: ユニオン型、オプショナル、型の絞り込み、ジェネリクスの入門。決済サービスのAPIレスポンス（成功・失敗・保留）に型を付けて、処理を分けます。
minutes: 60
---

## 外部から来たデータは「信用しない」

APIのレスポンスやファイル、フォームの入力など、プログラムの外から来たデータは、**仕様どおりの形とは限りません**。相手のシステムの不具合や仕様変更で、項目が欠けたり、型が違ったりします。

`response.json()` の戻り値に `as PaymentResult` と書くだけでは、TypeScript は「そう信じる」だけで、中身は何も確かめていません。**外部との境目で一度だけ形を確かめて、それ以降は型を信用できる状態にする** のが基本です。

```ts
const json: unknown = await response.json(); // まだ何も分からない
const result = parsePaymentResponse(json);    // ここで確かめる。以降は型どおり
```

`unknown` は「何が入っているか分からない」型です。確かめるまでは、プロパティにアクセスできません（`any` と違って安全）。

## ユニオン型と判別可能なユニオン

「成功・失敗・保留のどれか」のように、いくつかの形のどれかであることは **ユニオン型**（`|`）で表します。

```ts
type PaymentResult =
  | { status: "succeeded"; paymentId: string; amount: number; paidAt: Date }
  | { status: "failed"; paymentId: string; error: { code: string; message: string } }
  | { status: "pending"; paymentId: string; redirectUrl: string };
```

すべての形に共通の `status` があり、値（`"succeeded"` など）で形が決まります。これを **判別可能なユニオン** と呼びます。`status` を調べると、TypeScript が自動で型を絞り込みます。

```ts
if (result.status === "succeeded") {
  result.paidAt; // OK: ここでは成功の形
  result.error;  // 型エラー: 成功の形には error がない
}
```

`amount?: number` のような **オプショナル** の項目で「成功のときだけ amount がある」と表すこともできますが、どの組み合わせがありえるのかが型から読めなくなります。形ごとに型を分けたほうが、間違いを型エラーで見つけられます。

## 型の絞り込み（narrowing）

`unknown` から安全に値を取り出すには、実行時のチェックで型を絞り込みます。

| 書き方 | 絞り込まれる型 |
| --- | --- |
| `typeof x === "string"` | `string` |
| `typeof x === "object" && x !== null` | `object`（`null` を除く） |
| `Array.isArray(x)` | 配列 |
| `x instanceof Date` | `Date` |
| `"status" in x` | `status` を持つオブジェクト |

何度も使うチェックは、**型ガード関数**（戻り値の型が `x is 型`）にまとめます。

```ts
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

チェックの量が多いときは、**zod** などのバリデーションのライブラリで「スキーマ」を書き、そこから型を作る方法もよく使われます（中級5で使います）。

## switch と never で「漏れ」を防ぐ

ユニオン型を `switch` で分けるとき、`default` で `never` 型の変数に代入しておくと、あとで形が増えたときに **直し忘れが型エラーになります**。

```ts
switch (result.status) {
  case "succeeded": return "完了";
  case "failed": return "失敗";
  case "pending": return "保留";
  default: {
    const unreachable: never = result; // 新しい status を足すとここが型エラーになる
    return unreachable;
  }
}
```

## ジェネリクス入門

「成功なら値、失敗ならエラー」という形は、中身の型だけが違って何度も出てきます。型の一部を引数のようにして、使うときに決められるのが **ジェネリクス** です。

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const r: Result<number, string> = { ok: true, value: 42 };
```

配列の `Array<string>` や `Promise<number>` も、ジェネリクスを使った型です。

## 型のテスト

Vitest の `expectTypeOf` を使うと、「この値の型はこうなっているはず」をテストできます。実行時には何もせず、**型チェック（`npm run typecheck`）で確かめます**。

```ts
if (r.status === "succeeded") expectTypeOf(r.paidAt).toEqualTypeOf<Date>();
```
