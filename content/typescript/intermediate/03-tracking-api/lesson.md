---
title: 非同期処理と外部API
summary: async / await、Promise.all による並列化、タイムアウト、リトライ、エラー処理を学びます。配送業者のAPIから複数の荷物の追跡状況を取得します。
minutes: 60
---

## 待ち時間のある処理と Promise

外部APIの呼び出しやファイルの読み込みは、結果が返るまで時間がかかります。JavaScript では、こうした処理は **Promise**（「あとで結果が入る箱」）を返します。`await` を付けると、結果が入るまで待ってから次の行に進みます。

```ts
async function getOrderStatus(id: number) {
  const res = await fetch(`https://api.example.com/orders/${id}`); // 返ってくるまで待つ
  if (!res.ok) throw new Error(`APIエラー: ${res.status}`);
  return await res.json();
}
```

`await` を使う関数には `async` を付けます。`async` 関数は必ず Promise を返します。

## 順番に待つか、まとめて待つか

10件の荷物を1件ずつ `await` すると、待ち時間は10件分の合計になります。

```ts
// 1件 300ms なら 3秒かかる
for (const n of numbers) results.push(await client.getStatus(n));
```

互いに関係のない処理は、**全部を先に始めて、まとめて待つ** と速くなります。

```ts
// 一番遅い1件の時間（300ms）で終わる
const results = await Promise.all(numbers.map((n) => client.getStatus(n)));
```

| 関数 | 動き |
| --- | --- |
| `Promise.all` | 全部が成功したら結果の配列。**1つでも失敗すると、全体が失敗** |
| `Promise.allSettled` | 成功・失敗にかかわらず、全部の結果（`fulfilled` / `rejected`）を返す |
| `Promise.race` | 一番先に終わったものの結果を返す |

`Promise.all` の結果は、終わった順ではなく **渡した順** に並びます。「1件の失敗で全体を失敗にしたくない」ときは、`allSettled` を使うか、1件ごとの処理の中で例外を受け止めて結果の値に変えておきます。

## 失敗に備える

外部APIは、遅かったり、一時的に失敗したりします。業務のシステムでは、次の3つをセットで考えます。

### 1. タイムアウト

応答がないまま待ち続けると、画面も固まります。**制限時間を決めて、過ぎたら諦める**。`fetch` は `AbortController` の `signal` を渡すと、途中で中断できます。

```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3000);
try {
  return await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timer); // 終わったらタイマーを止める
}
```

### 2. リトライ（やり直し）

一時的な失敗（タイムアウト、500番台のサーバーエラー）は、やり直すと成功することがあります。ただし、**やり直しても結果が変わらない失敗はやり直さない**。

| 失敗 | やり直す？ | 理由 |
| --- | --- | --- |
| タイムアウト、500番台 | やり直す | 相手側の一時的な問題かもしれない |
| 404（見つからない） | やり直さない | 何度聞いても見つからない |
| 400、401 など | やり直さない | こちらのリクエストが間違っている |

やり直しの回数には上限を付けます。本番では、やり直すたびに少し待つ時間を延ばす（エクスポネンシャルバックオフ）こともよくあります。

### 3. エラーを「結果」として返す

呼び出し側が扱いやすいように、失敗の種類（見つからない、時間切れ、エラー）を **値として返す** と、画面で「この荷物は見つかりませんでした」のように出し分けられます。前のレッスンの判別可能なユニオンが使えます。

```ts
type TrackingResult =
  | { trackingNumber: string; ok: true; status: TrackingStatus }
  | { trackingNumber: string; ok: false; reason: "not_found" | "timeout" | "error" };
```

## 外部APIはインターフェースで受け取る

関数の中で直接 `fetch` を呼ぶと、テストのたびに本物のAPIを呼んでしまいます。「追跡状況を取得するもの」を **インターフェース** として引数で受け取れば、テストでは好きな動き（遅い、失敗する）をする偽物（モック）を渡せます。

```ts
interface TrackingClient {
  getStatus(trackingNumber: string, signal: AbortSignal): Promise<TrackingStatus>;
}
```
