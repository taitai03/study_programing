# study_programing

初学者から上級者まで、Swift / JavaScript（TypeScript）/ Ruby（Rails）を手を動かしながら学べるWebアプリケーション。

- 要件定義: [docs/requirements.md](docs/requirements.md)
- 全体設計: [docs/architecture.md](docs/architecture.md)
- カリキュラム案: [docs/curriculum.md](docs/curriculum.md)
- サンプルアプリ「さくらマート」仕様: [docs/sakura-mart.md](docs/sakura-mart.md)

## 構成

| 要素 | 使っているもの |
| --- | --- |
| アプリ | Next.js 16（App Router）、TypeScript、Tailwind CSS、shadcn/ui |
| 認証 | Better Auth（GitHub App でログイン ＋ 許可リスト） |
| GitHub 連携 | GitHub App（課題リポジトリのPRとテストの結果を Webhook で受け取って判定する） |
| DB | PostgreSQL ＋ Drizzle ORM（ローカルは Docker、本番は Neon） |
| エディタ・実行 | Monaco Editor、受講者のコードは Web Worker 内で実行（TypeScript は sucrase で変換、Ruby は ruby.wasm） |
| 教材 | `content/` の Markdown と YAML |
| 課題のテンプレート | `templates/`（さくらマートのアプリと、課題の開始ブランチ。GitHub の `practice-*` リポジトリに公開する） |

## ローカルで動かす

必要なもの: Node.js 24、Docker

```bash
npm install
```

```bash
cp .env.example .env.local
```

`.env.local` を編集します。

- `BETTER_AUTH_SECRET`: `openssl rand -base64 32` で生成した値
- `INITIAL_ADMIN_GITHUB_LOGIN`: 最初の管理者のGitHubユーザー名
- GitHubでログインする・課題リポジトリと連携する場合: GitHub App を作り、`GITHUB_CLIENT_ID` などを設定（手順は [docs/github-app.md](docs/github-app.md)）
- GitHubなしで動作確認する場合: `DEV_LOGIN=true` と `DEV_LOGIN_PASSWORD`（8文字以上の任意の文字列）を設定

DBを起動して、テーブルを作ります。

```bash
docker compose up -d
```

```bash
npm run db:migrate
```

開発用ログインを使う場合は、開発用のユーザー（受講者・管理者）を作ります。

```bash
npm run seed:dev
```

```bash
npm run dev
```

http://localhost:3000 を開きます。

## テスト

```bash
npm test
```

アプリのテストに加えて、`content/content.test.ts` で教材をチェックします（模範解答が型エラーなしで全テストに合格すること、最初のコードのままでは合格しないこと、など）。教材を追加・修正したら必ず実行してください。

- Ruby の教材は、Node.js から ruby.wasm（`@ruby/3.4-wasm-wasi`）で実行して確認します
- Swift の Playground は、`swiftc` がある環境（Xcode を入れた Mac）でだけ、模範解答がセルフチェックをすべて通ることを確認します。`swiftc` がなければスキップします

## 教材の追加

`content/<言語>/<レベル>/<NN-slug>/` に次のファイルを置きます。コースの一覧は `content/courses.yaml` です。

| ファイル | 内容 |
| --- | --- |
| `lesson.md` | 解説。frontmatter に `title`、`summary`、`minutes` |
| `exercise.yaml` | 演習。`ticket`（チケット形式の課題文）、`starter`、`solution`、`tests`、`hints`、`typecheck` |
| `quiz.yaml` | 確認クイズ。`questions`（`question`、`choices`、`answer`、`explanation`） |
| `task.yaml` | ローカルで解いてPRを出す課題（中級以降）。`ticket`（課題文）、`protectedPaths`（受講者が変更してはいけないファイル）、`hints` |

テストのコードでは `expect(値).toBe(期待値)` などと、出力の配列 `logs` が使えます（[src/lib/runner/harness.ts](src/lib/runner/harness.ts)）。

Ruby の教材では、テストを RSpec に近い形で書きます（[src/lib/runner/ruby.ts](src/lib/runner/ruby.ts)）。`typecheck` は使いません。

```ruby
expect(calc_shipping_fee(3000)).to eq(550)
expect(names).to include("天然水 2L")
expect { cart.add(juice, 0) }.to raise_error(ArgumentError)
expect(logs.first(2)).to eq(["550", "0"]) # logs は puts / p の出力（1行ずつ）
```

演習（`exercise.yaml`）がないレッスンは、確認クイズに合格すると完了になります。Swift 初級（Xcode Playground）と「開発の準備」はこの形です。Swift のレッスンには次のファイルを置きます。

| ファイル | 内容 |
| --- | --- |
| `ticket.md` | Playground で解く演習の課題文 |
| `playground/Contents.swift` | 受講者に配るコード。最後にセルフチェック（`check(...)`）を入れる |
| `solution.swift` | 模範解答。受講者には配らず、教材のテストで使う |

セルフチェック用の `check` 関数は `content/swift/beginner/SelfCheck.swift` にあり、ダウンロードする Playground の `Sources/` に入ります。

## PRで解く課題（中級以降）

中級以降の課題は、受講者が自分の GitHub アカウントに作った課題リポジトリで解き、PRを出して提出します。

- 課題文は `content/<言語>/<レベル>/<NN-slug>/task.yaml`。開始ブランチは `start/<NN-slug>`
- さくらマートのアプリと、課題ごとの開始ブランチの準備（テスト、模範解答）は `templates/` にあります。検証と公開の手順は [templates/README.md](templates/README.md)
- PR の判定: 開始ブランチに向けたPRで、GitHub Actions のテストがすべて通れば合格。課題のテストや `.github/` を変更したPRは判定対象外。合格した状態でマージすると、課題が完了になる
- GitHub App の設定は [docs/github-app.md](docs/github-app.md)

## メンター・管理者向けの画面

| 画面 | URL | 使える人 |
| --- | --- | --- |
| 受講者一覧 | `/mentor` | mentor、admin |
| 受講者の詳細（レッスンごとの状態、提出の履歴） | `/mentor/users/<GitHubユーザー名>` | mentor、admin |
| 提出の詳細（PRの差分、テストの結果） | `/mentor/submissions/<ID>` | mentor、admin |
| ユーザー管理 | `/admin/users` | admin |
