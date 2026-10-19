# さくらマート 管理画面（Next.js版）

架空のECショップ「さくらマート」の、スタッフ向け管理画面と会員向けAPIです。プログラミング研修の **JavaScript / TypeScript 中級** の課題で使います。

## 構成

| 要素 | 使っているもの |
| --- | --- |
| フレームワーク | Next.js（App Router）、TypeScript |
| DB | SQLite（`data/dev.db`）＋ Drizzle ORM |
| スタッフのログイン | Auth.js（メールアドレスとパスワード） |
| 画面 | Tailwind CSS（shadcn/ui 風のコンポーネント） |
| テスト | Vitest、React Testing Library |

## 動かす

必要なもの: Node.js 22 以上

```bash
npm install
cp .env.example .env.local   # AUTH_SECRET に npx auth secret で作った値を入れる
npm run db:migrate           # テーブルを作る
npm run db:seed              # 初期データ（商品50件、会員200人、注文2,000件）を入れる
npm run dev
```

http://localhost:3000 を開き、`admin@sakura-mart.example` / `password` でログインします。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm test` | テストを実行する（`npx vitest src/lib/pricing.test.ts` のようにファイルを指定もできる） |
| `npm run typecheck` | 型チェック |
| `npm run lint` | ESLint |
| `npm run db:generate` | `src/db/schema.ts` を変えたあと、マイグレーションを作る |
| `npm run db:reset` | DBを作り直して初期データを入れ直す |

## フォルダ構成

```
src/
├── app/
│   ├── admin/          # 管理画面（ログイン必須）
│   ├── api/            # API（会員向け、スタッフ向け）
│   └── login/          # スタッフのログイン
├── components/         # 画面の部品
├── db/                 # テーブル定義（schema.ts）、初期データ（seed.ts）
├── lib/                # 業務のロジック（料金計算、注文など）
└── test/               # テストの準備（テストごとにメモリ上のDBを作り直す）
```

## 業務のルール

料金計算（`src/lib/pricing.ts`）は次の順番で行います。端数はすべて切り捨てです。

1. **小計**: 商品の価格（税抜）× 数量 の合計
2. **会員ランク割引**: 一般 0%、シルバー 5%、ゴールド 10%
3. **クーポン割引**: ランク割引のあとの金額に適用する。最低購入金額も、ランク割引のあとの金額で判定する
4. **消費税**: 割引後の金額に10%を加える
5. **送料**: 550円（税込）。消費税を加えた金額が5,000円以上なら無料
6. **合計**: 4 ＋ 5

ポイントは、4の金額（送料を含まない税込金額）の1%（ゴールド会員は2%）です。

注文のステータスは 受付（pending）→ 支払済（paid）→ 発送済（shipped）→ 完了（completed）と進みます。受付と支払済の注文はキャンセル（cancelled）できます。売上の集計には、キャンセルの注文を含めません。

## 会員向けAPI

会員向けAPIは `Authorization: Bearer <APIトークン>` で認証します。初期データの会員のトークンは `member-0001-token` のような形です。

```bash
curl http://localhost:3000/api/products
curl -H "Authorization: Bearer member-0001-token" http://localhost:3000/api/me/orders
curl -X POST -H "Authorization: Bearer member-0001-token" -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2}],"couponCode":"WELCOME500"}' \
  http://localhost:3000/api/orders
```

## 課題の進め方

課題ごとに **開始ブランチ**（`start/07-order-filter` など）があります。課題文は開始ブランチの `TASK.md` にあります。

```bash
git switch start/07-order-filter
git switch -c work/07-order-filter
# 実装して commit
git push -u origin work/07-order-filter
# GitHub で start/07-order-filter に向けてPRを作る
```

PRを作ると GitHub Actions でテストが実行されます。課題で用意したテスト（`*.task.test.ts`）、`src/test/`、`.github/` は変更しないでください。変更したPRは判定の対象外になります。
