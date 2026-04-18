# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # 開発サーバー起動 (localhost:3000)
npm run build        # Vercel 向けビルド
npm run cf:build     # Cloudflare Pages 向けビルド (opennextjs-cloudflare)
npm run cf:preview   # Cloudflare ローカルプレビュー
npm run cf:deploy    # Cloudflare ビルド & デプロイ
```

型チェック・リントのコマンドは未設定。ビルドが型チェックを兼ねる。

## Architecture

### 概要

ログイン不要のリアルタイム多人数ゲーム。セッションIDを `localStorage` で管理し、Supabase Realtime でゲーム状態を全クライアント間で同期する。

### データフロー

1. ユーザーがトップ (`/`) で部屋を作成 → Supabase に `rooms` レコードを INSERT
2. 招待リンク (`/room/[id]`) でゲスト参加 → ニックネーム入力後 `players` に INSERT
3. `app/room/[id]/page.tsx` がゲームの中枢。`useEffect` 内で Supabase Realtime チャネルを1本購読し、`rooms / players / rounds / answers` テーブルの変更イベントを受け取って state を更新する
4. ゲームの進行（ラウンド作成・回答・判定）はすべてクライアントが直接 Supabase を CRUD する（専用APIルートなし）

### ラウンドのステータス遷移

```
questioning → answering → reviewing → judging → completed
```

- `questioning`: 親プレイヤーがお題を選択中
- `answering`: 全プレイヤーが回答を入力中
- `reviewing`: 全員の回答を確認中
- `judging`: 親が一致/不一致を判定中
- `completed`: ラウンド終了

### 認証

- **ゲームプレイヤー**: 認証なし。`lib/session.ts` の `getOrCreateSessionId()` が `localStorage` の `zeniichi_session_id` に UUID を永続化
- **管理者**: `ADMIN_USERNAME` / `ADMIN_PASSWORD` 環境変数と照合し、HMAC-SHA256 署名トークンを httpOnly Cookie に保存 (`lib/admin-auth.ts`)。`middleware.ts` が `/admin/*` を保護する

### 主要ファイル

| パス | 役割 |
|---|---|
| `app/room/[id]/page.tsx` | ゲーム画面の中枢。全 state 管理と Realtime 購読 |
| `components/room/` | ラウンドの各フェーズに対応するビューコンポーネント群 |
| `lib/game.ts` | 親プレイヤーの決定ロジック・全員回答完了チェック |
| `lib/supabase.ts` | ブラウザ側 Supabase シングルトンクライアント |
| `lib/admin-auth.ts` | 管理者セッショントークンの生成・検証（Web Crypto API） |
| `middleware.ts` | `/admin/*` のアクセス制御 |
| `types/game.ts` | 全データ型定義 |
| `supabase/migrations/` | DB スキーマ定義 |

### DB テーブル構成

- `rooms`: ゲーム部屋（設定 JSON、ステータス、24時間後の `expires_at`）
- `players`: 参加者（`room_id` + `session_id` でユニーク）
- `rounds`: ラウンド（お題・ステータス・判定結果）
- `answers`: 回答（`round_id` + `player_session_id` でユニーク）
- `preset_questions`: プリセットお題（管理者画面 `/admin` で編集可能）

全テーブルで RLS 有効。ゲームテーブルは全員読み書き可（セッションIDで識別）。

### 環境変数

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase プロジェクト URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase 匿名キー
ADMIN_USERNAME                # 管理者ログイン ID
ADMIN_PASSWORD                # 管理者ログイン パスワード（HMAC の署名鍵を兼ねる）
```

デプロイ先（Vercel / Cloudflare）にも同じ環境変数が必要。
