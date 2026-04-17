# 🎯 全員一致ゲーム

複数人でリアルタイムに楽しめるブラウザゲームです。
親がお題を出し、全員の回答が一致することを目指します。

## 機能

- 部屋を作ってURLで友達を招待
- ニックネームのみで参加可能（ログイン不要）
- リアルタイムで状態が同期
- 親の決め方を4種類から選べる
- プリセット質問 or 自由入力でお題を出せる
- スコア集計

## セットアップ

### 1. Supabaseプロジェクトを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/migrations/001_initial_schema.sql` を実行
3. **Realtime** を有効化（Table Editor で `rooms`, `players`, `rounds`, `answers` それぞれの Realtime を ON）

### 2. 環境変数を設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

Supabaseダッシュボードの Project Settings > API から値を取得して設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 開発サーバー起動

```bash
npm install
npm run dev
```

## Vercelへのデプロイ

1. GitHubにプッシュ
2. Vercelでリポジトリをインポート
3. 環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
4. デプロイ

## ページ構成

| パス | 説明 |
|---|---|
| `/` | トップページ（部屋を作るボタン） |
| `/room/[id]` | ゲームページ（参加〜ゲーム終了まで） |
| `/admin` | 管理者画面（プリセット質問管理） |

## ゲームの流れ

```
部屋を作る → ニックネーム入力 → ロビー（参加者を待つ）
    ↓ ホストが「ゲームを開始する」
親がお題を入力（プリセット or 自由入力）
    ↓ 「出題する」
全員が回答を入力
    ↓ 親が「回答終了」
全員の回答が表示される
    ↓ 親が「全員一致！」or「不一致」を判定
スコア表示 → 次のラウンドへ
```

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (PostgreSQL + Realtime)
- **Tailwind CSS + shadcn/ui**
- **TypeScript**
