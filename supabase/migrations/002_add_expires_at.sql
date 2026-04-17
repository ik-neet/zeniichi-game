-- rooms テーブルに有効期限カラムを追加
alter table rooms add column expires_at timestamptz not null default (now() + interval '24 hours');

-- 既存レコードも 24 時間後に設定
update rooms set expires_at = created_at + interval '24 hours';

-- クリーンアップ用インデックス
create index idx_rooms_expires_at on rooms(expires_at);
