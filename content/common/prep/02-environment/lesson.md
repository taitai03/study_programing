---
title: 言語別の環境構築
summary: Homebrew、mise による Node.js / Ruby のバージョン管理、Xcode、VS Code を用意し、README の手順どおりにプロジェクトを動かす方法を学びます。
minutes: 60
---

## 開発環境とは

中級からは、自分のPCでアプリを動かしながら開発します。そのために、言語の実行環境（Node.js、Ruby など）やエディタを用意します。これを **環境構築** といいます。

環境構築は、つまずきやすい作業です。でも、**手順書（README）を上から順に、書かれたとおりに進める** ことと、**エラーが出たらメッセージを読む** ことを守れば、たいていは解決できます。

## 必要なもの

| 道具 | 役割 | 必要なコース |
| --- | --- | --- |
| Homebrew | Mac にツールを入れるための道具（パッケージマネージャー） | すべて |
| Git | 変更の記録（次のレッスンで学びます） | すべて |
| VS Code | コードを書くエディタ | JS/TS、Ruby |
| mise | Node.js や Ruby の **バージョン** を、プロジェクトごとに切り替える | JS/TS、Ruby |
| Xcode | iOS アプリの開発 | Swift |

### Homebrew

[Homebrew の公式サイト](https://brew.sh/ja/) に書かれているインストール用のコマンドを、ターミナルに貼り付けて実行します。インストールが終わると、`brew install ツール名` でツールを入れられるようになります。

```bash
brew --version   # バージョンが表示されれば成功
brew install git mise
```

インストールの最後に「Next steps」として、追加で実行するコマンドが表示されることがあります。**表示されたら、必ずそのとおりに実行してください**。実行しないと、あとで `command not found: brew` になります。

### mise でバージョンをそろえる

プロジェクトごとに、使う言語のバージョンが決まっています。チームの全員が同じバージョンを使わないと、「自分のPCでは動くのに、ほかの人のPCでは動かない」ということが起きます。

mise は、プロジェクトのフォルダにあるファイル（`.tool-versions` や `mise.toml`）を読んで、決められたバージョンを自動で使ってくれるツールです。

```bash
# mise を使えるようにする（最初の1回だけ。zsh の場合）
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
# ターミナルを開き直してから、プロジェクトのフォルダで
mise install     # プロジェクトで決められたバージョンを入れる
node --version   # 決められたバージョンになっているか確認
```

### VS Code

[VS Code の公式サイト](https://code.visualstudio.com/) からダウンロードしてインストールします。プロジェクトのフォルダを開くと、おすすめの拡張機能（ESLint、Ruby LSP など）を案内してくれることがあるので、入れておきましょう。

### Xcode

Swift 初級で入れた Xcode を使います。中級では、Xcode で iOS アプリのプロジェクトを開いて、シミュレーターで動かします。

## README の手順どおりにプロジェクトを動かす

プロジェクトには、たいてい **README.md** に「動かし方」が書かれています。新しいプロジェクトに参加したら、まず README を読みます。

さくらマートの Next.js 版なら、たとえば次のような手順です。

```bash
git clone https://github.com/自分のアカウント/practice-ts-intermediate.git
cd practice-ts-intermediate
mise install          # Node.js のバージョンをそろえる
npm install           # ライブラリを入れる
cp .env.example .env  # 設定ファイルを用意する
npm run dev           # 開発用のサーバーを起動する
```

- `.env` には、パスワードや API キーなどの **秘密の設定** を書きます。`.env` は Git で共有しない（次のレッスンの `.gitignore`）ので、ひな形の `.env.example` をコピーして作ります
- `npm run dev` のようなサーバーは、止めるまで動き続けます。止めるときは `Control + C` を押します

### つまずいたときは

1. **エラーメッセージの最後のほう** を読む。原因は最後に書かれていることが多い
2. README の手順を **飛ばしていないか** 確認する（特に「最初の1回だけ」の手順）
3. バージョンが README と同じか確認する（`node --version`、`ruby --version`）
4. 調べても分からなければ、**実行したコマンド・エラーメッセージの全文・試したこと** をそろえてメンターに相談する（レッスン5で詳しく学びます）

## やってみよう

1. Homebrew をインストールして、`brew install git mise` を実行する
2. 自分のコースに合わせて、VS Code または Xcode を用意する
3. `git --version`、`mise --version` でバージョンが表示されることを確認する

中級の最初の課題で、さくらマートのアプリを実際に手元で起動します。
