---
title: 配列と繰り返し
summary: 注文一覧のような「たくさんのデータ」を配列で扱い、繰り返し処理で合計や件数を求めます。
minutes: 40
---

## たくさんの値をまとめる: 配列

1日の注文金額のように、同じ種類の値がたくさんあるときは **配列** にまとめます。

```ts
const orderTotals = [3280, 1500, 12800, 980];

console.log(orderTotals[0]);      // 3280（最初の要素。番号は0から数える）
console.log(orderTotals.length);  // 4（要素の数）
```

TypeScriptでは、数値の配列の型を `number[]` と書きます。

```ts
const orderTotals: number[] = [3280, 1500, 12800, 980];
```

## 1つずつ処理する: `for...of`

配列の要素を1つずつ取り出して処理するには `for...of` を使います。

```ts
const orderTotals = [3280, 1500, 12800, 980];

for (const total of orderTotals) {
  console.log(total);
}
// 3280
// 1500
// 12800
// 980
```

`{ }` の中が、要素の数だけ繰り返し実行されます。1回目は `total` が `3280`、2回目は `1500`、… となります。

## 集計の基本パターン

業務のデータ処理の多くは、次の3つのパターンの組み合わせです。

### 合計

```ts
let sum = 0;
for (const total of orderTotals) {
  sum = sum + total;
}
```

最初に `0` を入れた変数を用意して、1つずつ足していきます。値が変わるので `let` を使います（`sum += total` とも書けます）。

### 条件に合うものの件数

```ts
let count = 0;
for (const total of orderTotals) {
  if (total >= 5000) {
    count = count + 1;
  }
}
```

繰り返しの中に `if` を入れると、条件に合うものだけを数えられます。

### 最大値

```ts
let max = 0;
for (const total of orderTotals) {
  if (total > max) {
    max = total;
  }
}
```

「今までで一番大きい値」を覚えておき、それより大きい値が来たら入れ替えます。

## 空の配列を忘れない

注文が1件もない日もあります。配列が空（`[]`）のとき、上のコードはどれも `0` を返します。**データが0件のときにどうなるか** は、業務のプログラムで必ず考えるポイントです。
