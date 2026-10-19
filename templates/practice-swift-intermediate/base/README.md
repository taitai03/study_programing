# さくらマート（iOS版）

架空のECショップ「さくらマート」の、会員向けの iOS アプリです。プログラミング研修の **Swift 中級** の課題で使います。

## 構成

| 要素 | 内容 |
| --- | --- |
| `SakuraMart/` | アプリの画面（SwiftUI、iOS 17 以上） |
| `SakuraMartKit/` | ロジック（モデル、料金計算、通信、ViewModel）。Swift Package に分けてあり、SwiftUI に依存しない |
| `SakuraMart.xcodeproj` | Xcode のプロジェクト（`project.yml` から XcodeGen で作ったもの） |
| テスト | Swift Testing（`SakuraMartKit/Tests/`） |

画面とロジックを分けているのは、ロジックを **Linux でもテストできる** ようにするためです（課題の判定は GitHub Actions の Linux で `swift test` を実行します）。ViewModel も `SakuraMartKit` に置き、`SwiftUI` や `Combine` を import しません（画面の更新は Observation の `@Observable` を使います）。

## 動かす

必要なもの: Xcode 16 以上

1. `SakuraMart.xcodeproj` を Xcode で開く
2. 上のバーで実行先のシミュレーター（iPhone 16 など）を選び、▶︎（Cmd + R）で実行する

テストは、ターミナルで実行します（Xcode で `SakuraMartKit/Package.swift` を開いて Cmd + U でも実行できます）。

```bash
swift test --package-path SakuraMartKit
swift test --package-path SakuraMartKit --filter PriceCalculatorTests   # 一部だけ
```

## フォルダ構成

```
SakuraMart/                      # 画面（SwiftUI）
├── SakuraMartApp.swift          # アプリの入口
├── AppConfig.swift              # どのAPI（モックか本物か）を使うか
├── RootView.swift               # タブ（商品、お気に入り、カート）
└── 〇〇View.swift
SakuraMartKit/
├── Sources/SakuraMartKit/
│   ├── Models.swift             # 商品、会員ランク
│   ├── Cart.swift / Coupon.swift
│   ├── PriceCalculator.swift    # 料金計算
│   ├── PointCalculator.swift    # ポイント計算
│   ├── ProductAPI.swift         # 商品のAPI（プロトコルとモック）
│   ├── FavoritesStore.swift     # お気に入り
│   └── 〇〇ViewModel.swift      # 画面のロジック
└── Tests/SakuraMartKitTests/    # テスト
```

## 業務のルール

料金計算（`PriceCalculator`）は次の順番で行います。端数はすべて切り捨てです。

1. **小計**: 商品の価格（税抜）× 数量 の合計
2. **会員ランク割引**: 一般 0%、シルバー 5%、ゴールド 10%
3. **クーポン割引**: ランク割引のあとの金額に適用する。最低購入金額も、ランク割引のあとの金額で判定する
4. **消費税**: 割引後の金額に10%を加える
5. **送料**: 550円（税込）。消費税を加えた金額が5,000円以上なら無料
6. **合計**: 4 ＋ 5

ポイントは、4の金額（送料を含まない税込金額）の1%（ゴールド会員は2%）です。

## 課題の進め方

課題ごとに **開始ブランチ**（`start/01-payment-fees` など）があります。課題文は開始ブランチの `TASK.md` にあります。

```bash
git switch start/01-payment-fees
git switch -c work/01-payment-fees
# 実装して commit
git push -u origin work/01-payment-fees
# GitHub で start/01-payment-fees に向けてPRを作る
```

PRを作ると GitHub Actions で `SakuraMartKit` のテストが実行されます。課題で用意したテスト（`Tests/SakuraMartKitTests/Tasks/`）、`Package.swift`、`.github/` は変更しないでください。変更したPRは判定の対象外になります。
