# 課題のテンプレートリポジトリ

中級以降の課題（ローカルで解いてPRを出す課題）で使う、さくらマートのアプリと課題の準備です。ここを正として、GitHub の `taitai03/practice-*` リポジトリに公開します。

| ディレクトリ | 公開先 | コース |
| --- | --- | --- |
| `practice-prep/` | `taitai03/practice-prep` | 共通: 開発の準備（レッスン4、5の練習課題） |
| `practice-ts-intermediate/` | `taitai03/practice-ts-intermediate` | JavaScript / TypeScript 中級 |
| `practice-rails-intermediate/` | `taitai03/practice-rails-intermediate` | Ruby / Rails 中級 |
| `practice-swift-intermediate/` | `taitai03/practice-swift-intermediate` | Swift 中級 |

## 構成

```
practice-ts-intermediate/
├── template.yaml              # コースID、テストの準備と実行のコマンド（検証に使う）
├── base/                      # main ブランチの内容（さくらマートのアプリ）
└── tasks/
    └── 07-order-filter/       # レッスンのスラッグと同じ名前
        ├── start/             # 開始ブランチ（start/07-order-filter）で追加・上書きするファイル
        └── solution/          # 模範解答（開始ブランチに上書きする）。公開しない
```

- 課題文は `content/<コース>/<スラッグ>/task.yaml` の `ticket` から、開始ブランチの `TASK.md` に書き出す
- 課題で用意したテストは、`*.task.test.ts`（TypeScript）、`spec/tasks/`（Rails）、`Tests/SakuraMartKitTests/Tasks/`（Swift）、`test/tasks/`（開発の準備）に置く。受講者が変更してはいけないファイルは `content/courses.yaml` の `protectedPaths`（コース共通）と `task.yaml` の `protectedPaths`（課題ごと）に書く
- 差分でファイルを消したいときは、`start/` や `solution/` に `.delete`（1行に1つのパス）を置く
- 「テストを書く」課題は、`.task/check.sh` で、受講者のテストをバグ入りの実装（`.task/mutants/`）に当てて、すべて見つけられるかを確かめる

## 検証する

課題ごとに、開始ブランチのままではテストが失敗し、模範解答を当てるとテストが通ることを確かめます。課題を追加・修正したら必ず実行してください。

```bash
npx tsx scripts/templates.ts verify practice-ts-intermediate             # すべての課題
npx tsx scripts/templates.ts verify practice-ts-intermediate 07-order-filter
```

必要なもの:

| テンプレート | 必要なもの |
| --- | --- |
| practice-prep、practice-ts-intermediate | Node.js 22 以上 |
| practice-rails-intermediate | Ruby（`base/.ruby-version`）と Bundler |
| practice-swift-intermediate | Swift 6.2（`swift` がなければ Docker の `swift:6.2` イメージを使う） |

課題の開始ブランチの内容を手元に作って試すには `checkout` を使います（`--solution` で模範解答を当てたもの）。

```bash
npx tsx scripts/templates.ts checkout practice-ts-intermediate 07-order-filter /tmp/order-filter --solution
```

## GitHub に公開する

`publish` で、`main` と課題ごとの開始ブランチを持つ Git リポジトリを作り、GitHub に push します。模範解答は含まれません。

```bash
npx tsx scripts/templates.ts publish practice-ts-intermediate /tmp/practice-ts-intermediate
cd /tmp/practice-ts-intermediate
git remote add origin git@github.com:taitai03/practice-ts-intermediate.git
git push --force origin --all
```

初めて公開するときは、先に GitHub でリポジトリを作り（**public**）、Settings → General の **Template repository** にチェックを入れてください。受講者はここから「Use this template」で自分のリポジトリを作ります。

公開し直すと、`main` と開始ブランチの履歴は作り直されます。すでに課題リポジトリを作った受講者には影響しません（受講者のリポジトリは、作った時点のコピーです）。

## Swift のテンプレートの Xcode プロジェクト

`practice-swift-intermediate/base/SakuraMart.xcodeproj` は、`project.yml` から [XcodeGen](https://github.com/yonaskolb/XcodeGen) で作ったものです。アプリのフォルダ（`SakuraMart/`）は「同期フォルダ」なので、課題でファイルを追加しても、プロジェクトを作り直す必要はありません。プロジェクトの設定を変えるときは、`project.yml` を直して作り直します。

```bash
cd templates/practice-swift-intermediate/base
xcodegen generate
```
