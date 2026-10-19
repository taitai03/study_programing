---
title: ファイルとデータの集計
summary: map / filter / reduce でデータを集計し、npm パッケージを使ってCSVを読み書きします。経理から依頼された売上CSVを出力するスクリプトを作ります。
minutes: 60
---

## 配列を変換する3つのメソッド

業務のデータ処理の多くは「配列を受け取って、別の形の配列や値にする」ことです。`for` 文でも書けますが、現場では次の3つのメソッドをよく使います。

| メソッド | すること | 例 |
| --- | --- | --- |
| `filter` | 条件に合うものだけを残す | キャンセルを除く |
| `map` | 1つずつ別の形に変える | 明細 → 金額 |
| `reduce` | 1つの値にまとめる | 金額の合計 |

```ts
const lines = [
  { status: "completed", unitPrice: 2980, quantity: 2 },
  { status: "cancelled", unitPrice: 980, quantity: 5 },
  { status: "shipped", unitPrice: 5500, quantity: 1 },
];

const sales = lines
  .filter((l) => l.status !== "cancelled")
  .map((l) => l.unitPrice * l.quantity)
  .reduce((sum, amount) => sum + amount, 0); // 11460
```

`reduce` の2つ目の引数（`0`）は合計の初期値です。省略すると、空の配列のときにエラーになります。

## グループごとに集計する

「月ごと・商品ごと」のようにグループに分けて集計するときは、`Map` に「グループのキー → 集計中の値」を入れていくのが分かりやすい書き方です。

```ts
const byProduct = new Map<number, number>();
for (const l of lines) {
  byProduct.set(l.productId, (byProduct.get(l.productId) ?? 0) + l.unitPrice * l.quantity);
}
```

キーを複数の項目で作るときは `` `${month}:${productId}` `` のように文字列にまとめます。

### 並べ替え

`sort` には「2つを比べて、負の数なら a が先」という関数を渡します。複数の条件で並べるときは `||` でつなぎます（前の条件が同じ＝0 のときだけ、次の条件で比べる）。

```ts
rows.sort((a, b) => a.month.localeCompare(b.month) || b.sales - a.sales);
```

## 日時とタイムゾーン

システムが出力する日時は、`2026-03-31T15:00:00Z` のように **UTC**（末尾の `Z`）で書かれていることがよくあります。これは日本時間（JST、UTC＋9時間）では **4月1日の0時** です。「月別」の集計を UTC のまま行うと、月末の夜の注文が前の月に入ってしまいます。**業務の「日付」や「月」は、どのタイムゾーンで数えるのか** を必ず確認してください。

```ts
// 日本時間の年月（"2026-04"）を作る
const month = new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
```

## CSV は自分で split しない

CSV は「カンマで区切るだけ」に見えますが、値にカンマや改行が入るときはダブルクォートで囲み、中のダブルクォートは `""` と2つ重ねる、などのルールがあります（RFC 4180）。`line.split(",")` では `"カタログギフト 5,000円コース"` を正しく読めません。

こういう「みんなが必要とする、地味に難しい処理」は、**実績のある npm パッケージ** を使います。

```bash
npm install csv-parse csv-stringify
```

```ts
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const rows: string[][] = parse(text, { skip_empty_lines: true });
const csv = stringify([["2026-04", 1, "国産こしひかり 5kg"]], { header: true, columns: ["month", "product_id", "product_name"] });
```

### パッケージを選ぶときに見ること

- 週あたりのダウンロード数、最終更新日（メンテナンスされているか）
- ドキュメントが整っているか、TypeScript の型があるか
- ライセンス（社内のルールで使ってよいものか）

`npm install` すると `package.json` と `package-lock.json` が変わります。**どちらも commit します**。`package-lock.json` があると、ほかの人やCIでも同じバージョンが入ります。

## 入力のエラーは「どこが悪いか」を伝える

人が作ったファイルや他システムのデータには、壊れた行が混ざります。エラーメッセージには **何行目の、どの値が、なぜだめか** を入れておくと、受け取った人がすぐに直せます。

```ts
throw new Error(`${line}行目: quantity が整数ではありません（${value}）`);
```
