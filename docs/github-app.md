# GitHub App の設定

> 前提: [architecture.md](architecture.md) の「4.3 中級・上級（ローカル＋PR）」

このアプリは、1つの GitHub App で次の2つを行います。

- **ログイン**: GitHub App の OAuth で受講者を認証する（M1 の OAuth App から切り替え）
- **課題リポジトリとの連携**: 受講者が自分の課題リポジトリに App をインストールすると、PR とテストの結果を Webhook で受け取り、判定してPRにコメントする。メンターの画面では、App の権限で受講者の private リポジトリの差分を読む

## 1. GitHub App を作る

[@taitai03](https://github.com/taitai03) のアカウントの Settings → Developer settings → GitHub Apps → **New GitHub App** で作ります。

| 項目 | 値 |
| --- | --- |
| GitHub App name | 例: `Study Programming`（URL の slug になる） |
| Homepage URL | アプリのURL（例: `https://study-programing.vercel.app`） |
| Callback URL | `<アプリのURL>/api/auth/callback/github`（ローカル用に `http://localhost:3000/api/auth/callback/github` も追加する） |
| Expire user authorization tokens | チェックを入れたままでよい（ログインのときにだけ使う） |
| Request user authorization (OAuth) during installation | チェックしない |
| Webhook → Active | チェックする |
| Webhook URL | `<アプリのURL>/api/github/webhook` |
| Webhook secret | `openssl rand -hex 32` で作った値（`GITHUB_WEBHOOK_SECRET` と同じ） |
| Where can this GitHub App be installed? | **Any account**（受講者が自分のアカウントにインストールするため） |

### 権限（Permissions）

| 種類 | 権限 | 使い道 |
| --- | --- | --- |
| Repository → Metadata | Read-only | 必須 |
| Repository → Contents | Read-only | 差分（開始ブランチとの比較）を読む |
| Repository → Pull requests | Read and write | PRと変更されたファイルを読む、判定の結果をコメントする |
| Repository → Checks | Read-only | テストの結果を読む |
| Repository → Actions | Read-only | ワークフローの完了の通知を受け取る |
| Account → Email addresses | Read-only | ログインのときにメールアドレスを読む |

### 受け取るイベント（Subscribe to events）

- Pull request
- Workflow run
- Check suite
- Repository

インストール（`installation`、`installation_repositories`）のイベントは、設定しなくても届きます。

## 2. 鍵とIDを環境変数に入れる

App の設定画面で、次の値を取得して環境変数に入れます（ローカルは `.env.local`、本番は Vercel の環境変数）。

| 環境変数 | 値 |
| --- | --- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | App の Client ID と、Generate a new client secret で作った値（ログインに使う） |
| `GITHUB_APP_ID` | App ID |
| `GITHUB_APP_SLUG` | App の URL の最後の部分（`https://github.com/apps/<slug>`） |
| `GITHUB_APP_PRIVATE_KEY` | Generate a private key でダウンロードした PEM の中身。改行は `\n` と書いてよい |
| `GITHUB_WEBHOOK_SECRET` | 上の Webhook secret |

M1 の OAuth App から切り替えても、受講者のアカウント（GitHub のユーザーID）は同じなので、学習の記録はそのまま引き継がれます。切り替えたあと、OAuth App は削除してかまいません。

## 3. テンプレートリポジトリを公開する

課題のテンプレートリポジトリ（`taitai03/practice-*`）を公開します。手順は [templates/README.md](../templates/README.md) を参照してください。

## 受講者の流れ

1. コースのページの「はじめに」から、テンプレートで自分のリポジトリを作る（リポジトリ名はテンプレートと同じ、private、Include all branches）
2. 同じページのリンクから、App を作ったリポジトリにインストールする
3. Webhook でリポジトリが受講者のコースに紐付く（届かなかったときは「連携を確認する」ボタンで、App の権限で読み直せる）
4. 開始ブランチに向けてPRを出すと、テストの結果で判定される。テストが通った状態でマージすると、課題が完了になる

紐付けの条件は「リポジトリの持ち主が、このアプリにログインしたことのあるユーザー」かつ「リポジトリ名がコースのテンプレートと同じ」です。

## ローカルで Webhook を受け取る

ローカル（`localhost`）には GitHub から Webhook が届きません。次のどちらかで試せます。

- [smee.io](https://smee.io) でチャンネルを作り、App の Webhook URL をそのURLにして、`npx smee-client --url <smee のURL> --target http://localhost:3000/api/github/webhook` を実行する
- Webhook を使わず、コースや課題のページの「GitHub の状態を読み直す」ボタンで、App の権限で GitHub から読み直す
