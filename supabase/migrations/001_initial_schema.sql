-- 全員一致ゲーム データベーススキーマ

-- rooms テーブル
create table rooms (
  id uuid primary key default gen_random_uuid(),
  host_session_id text not null,
  settings jsonb not null default '{"parentMode":"host","fixedParentNickname":null,"parentCanAnswer":true}',
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

-- players テーブル
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  session_id text not null,
  nickname text not null,
  score integer not null default 0,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(room_id, session_id)
);

-- rounds テーブル
create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number integer not null default 1,
  parent_session_id text not null,
  question text,
  status text not null default 'questioning' check (status in ('questioning', 'answering', 'reviewing', 'judging', 'completed')),
  result text check (result in ('match', 'no_match')),
  created_at timestamptz not null default now()
);

-- answers テーブル
create table answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_session_id text not null,
  player_nickname text not null,
  content text not null,
  submitted_at timestamptz not null default now(),
  unique(round_id, player_session_id)
);

-- preset_questions テーブル
create table preset_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

-- インデックス
create index idx_players_room_id on players(room_id);
create index idx_rounds_room_id on rounds(room_id);
create index idx_answers_round_id on answers(round_id);

-- RLS 有効化
alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table answers enable row level security;
alter table preset_questions enable row level security;

-- 全員読み書き可能なポリシー (セッションIDで識別するため)
create policy "allow all" on rooms for all using (true) with check (true);
create policy "allow all" on players for all using (true) with check (true);
create policy "allow all" on rounds for all using (true) with check (true);
create policy "allow all" on answers for all using (true) with check (true);
create policy "allow read" on preset_questions for select using (true);
create policy "allow write" on preset_questions for all using (true) with check (true);

-- サンプルのプリセット質問
insert into preset_questions (text, category) values
  ('好きな食べ物は？', 'food'),
  ('好きな色は？', 'preference'),
  ('休日の過ごし方は？', 'lifestyle'),
  ('好きなスポーツは？', 'sports'),
  ('ストレス解消法は？', 'lifestyle'),
  ('好きな季節は？', 'preference'),
  ('朝型 or 夜型？', 'lifestyle'),
  ('犬派 or 猫派？', 'preference'),
  ('好きな映画ジャンルは？', 'entertainment'),
  ('旅行先で行きたい場所は？', 'travel');
