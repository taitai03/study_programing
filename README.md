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
| 認証 | Better Auth（GitHubログイン ＋ 許可リスト） |
| DB | PostgreSQL ＋ Drizzle ORM（ローカルは Docker、本番は Neon） |
| エディタ・実行 | Monaco Editor、受講者のコードは Web Worker 内で実行 |
| 教材 | `content/` の Markdown と YAML |

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
- GitHubでログインする場合: [GitHub OAuth App](https://github.com/settings/developers) を作り、`GITHUB_CLIENT_ID` と `GITHUB_CLIENT_SECRET` を設定（コールバックURLは `http://localhost:3000/api/auth/callback/github`）
- GitHubなしで動作確認する場合: `DEV_LOGIN=true` と `DEV_LOGIN_PASSWORD`（任意の文字列）を設定

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

## 教材の追加

`content/<言語>/<レベル>/<NN-slug>/` に次のファイルを置きます。コースの一覧は `content/courses.yaml` です。

| ファイル | 内容 |
| --- | --- |
| `lesson.md` | 解説。frontmatter に `title`、`summary`、`minutes` |
| `exercise.yaml` | 演習。`ticket`（チケット形式の課題文）、`starter`、`solution`、`tests`、`hints`、`typecheck` |
| `quiz.yaml` | 確認クイズ。`questions`（`question`、`choices`、`answer`、`explanation`） |

テストのコードでは `expect(値).toBe(期待値)` などと、出力の配列 `logs` が使えます（[src/lib/runner/harness.ts](src/lib/runner/harness.ts)）。
