# さくらマート 社内ツール（練習用）

「開発の準備」コースで、PRの出し方とデバッグを練習するための小さなリポジトリです。送料の計算と、売上ランキングを作る社内ツールが入っています。

## 動かす

必要なもの: Node.js 22 以上（「言語別の環境構築」のレッスンで入れたもの）

```bash
npm test
```

ほかのパッケージは使っていないので、`npm install` は不要です。テストには Node.js に入っているテストランナー（`node --test`）を使います。

## フォルダ構成

```
src/
├── shipping.js    # 送料の計算
└── ranking.js     # 商品の売上ランキング
test/              # テスト
```

## 課題の進め方

課題ごとに **開始ブランチ**（`start/04-github-pr` など）があります。課題文は開始ブランチの `TASK.md` にあります。

```bash
git switch start/04-github-pr
git switch -c work/04-github-pr
# 直して commit
git push -u origin work/04-github-pr
# GitHub で start/04-github-pr に向けてPRを作る
```

課題で用意したテスト（`test/tasks/`）と `.github/` は変更しないでください。変更したPRは判定の対象外になります。
