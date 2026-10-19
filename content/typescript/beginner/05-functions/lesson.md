---
title: 関数にまとめる
summary: 業務ルールを「関数」という部品にまとめる方法と、そうする理由を学びます。仕様書から関数を白紙で書きます。
minutes: 45
---

## 関数は「値を受け取って、答えを返す」部品

これまでの演習でも使ってきた関数を、きちんと見ていきます。

```ts
function calcTax(amount: number): number {
  return Math.floor((amount * 10) / 100);
}

console.log(calcTax(1000)); // 100
```

| 部分 | 例 | 意味 |
| --- | --- | --- |
| 関数名 | `calcTax` | 何をする関数かが分かる名前を付ける |
| 引数（ひきすう） | `amount: number` | 受け取る値と、その型 |
| 戻り値の型 | `: number` | 返す値の型 |
| `return` | `return ...;` | 答えを返す |

引数は複数受け取れます。

```ts
function calcSubtotal(price: number, quantity: number): number {
  return price * quantity;
}
```

## なぜ関数にまとめるのか

送料のルールを、カート画面・注文確認画面・メールの3か所に直接書いていたとします。ルールが「6,000円以上で無料」に変わったら、3か所すべてを直す必要があり、1か所でも直し忘れると、画面によって送料が違うバグになります。

**ルールを1つの関数にまとめて、どこからでもその関数を呼ぶ** ようにしておけば、直すのは1か所だけです。さらに、関数ごとにテストできるので、ルールが正しいかを確かめやすくなります。

## 関数から関数を呼ぶ

小さな関数を組み合わせて、大きな処理を作れます。

```ts
function getRankDiscountRate(rank: string): number {
  if (rank === "gold") return 10;
  if (rank === "silver") return 5;
  return 0;
}

function calcRankDiscount(subtotal: number, rank: string): number {
  return Math.floor((subtotal * getRankDiscountRate(rank)) / 100);
}
```

## アロー関数

関数は、次のようにも書けます（**アロー関数**）。現場のTypeScriptではよく使われる書き方です。

```ts
const calcSubtotal = (price: number, quantity: number): number => {
  return price * quantity;
};

// 1行で答えを返すだけなら、{ } と return を省略できる
const calcSubtotal2 = (price: number, quantity: number): number => price * quantity;
```

どちらの書き方でも、呼び出し方は同じです。

## 仕様書から関数を書くときの手順

1. 仕様書から **関数名・受け取る値・返す値** を確認する
2. ルールを箇条書きにして、**どの順番で判定するか** を決める
3. 書いたら、仕様書の例や **境目の値** で確かめる
