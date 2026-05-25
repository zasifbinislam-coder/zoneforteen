-- ============================================================
-- Zone14 — Supabase one-time setup
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Predictions table — one row per (match × customer name)
create table if not exists public.predictions (
  id          uuid primary key default gen_random_uuid(),
  match_id    text not null,
  name        text not null,
  choice      text not null check (choice in ('home','draw','away')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (match_id, name)
);

create index if not exists predictions_match_idx on public.predictions (match_id);

-- 2. Match results — one row per finished match
create table if not exists public.match_results (
  match_id    text primary key,
  home_score  integer not null check (home_score >= 0 and home_score < 50),
  away_score  integer not null check (away_score >= 0 and away_score < 50),
  outcome     text not null check (outcome in ('home','draw','away')),
  finished_at timestamptz default now()
);

-- 3. Enable Row Level Security
alter table public.predictions    enable row level security;
alter table public.match_results  enable row level security;

-- 4. Policies — predictions are a public game, anyone can read/write
drop policy if exists "predictions_read"   on public.predictions;
drop policy if exists "predictions_insert" on public.predictions;
drop policy if exists "predictions_update" on public.predictions;
drop policy if exists "predictions_delete" on public.predictions;
create policy "predictions_read"   on public.predictions for select using (true);
create policy "predictions_insert" on public.predictions for insert with check (true);
create policy "predictions_update" on public.predictions for update using (true) with check (true);
create policy "predictions_delete" on public.predictions for delete using (true);

-- 5. Match results — open writes for now (admin passcode is the gate).
--    To lock down later, add Supabase Auth and require auth.uid() is not null.
drop policy if exists "results_read"   on public.match_results;
drop policy if exists "results_insert" on public.match_results;
drop policy if exists "results_update" on public.match_results;
drop policy if exists "results_delete" on public.match_results;
create policy "results_read"   on public.match_results for select using (true);
create policy "results_insert" on public.match_results for insert with check (true);
create policy "results_update" on public.match_results for update using (true) with check (true);
create policy "results_delete" on public.match_results for delete using (true);

-- 6. Enable realtime broadcasts so the landing page leaderboard updates
--    instantly when anyone (anywhere in the world) submits a prediction.
alter publication supabase_realtime add table public.predictions;
alter publication supabase_realtime add table public.match_results;

-- ============================================================
-- 7. JERSEY MEDIA — admin photo/video uploads
--    Run this section ONCE after you've created the 'media' bucket
--    in Storage (Dashboard → Storage → New bucket → name 'media',
--    Public bucket: ON).
-- ============================================================
create table if not exists public.jersey_media (
  id            uuid primary key default gen_random_uuid(),
  jersey_id     text not null,
  type          text not null check (type in ('image','video')),
  url           text not null,
  storage_path  text not null,
  name          text,
  size_bytes    bigint,
  sort_order    integer default 0,
  uploaded_at   timestamptz default now()
);
create index if not exists jersey_media_jersey_idx on public.jersey_media (jersey_id);

alter table public.jersey_media enable row level security;

drop policy if exists "jersey_media_read"   on public.jersey_media;
drop policy if exists "jersey_media_insert" on public.jersey_media;
drop policy if exists "jersey_media_update" on public.jersey_media;
drop policy if exists "jersey_media_delete" on public.jersey_media;
create policy "jersey_media_read"   on public.jersey_media for select using (true);
create policy "jersey_media_insert" on public.jersey_media for insert with check (true);
create policy "jersey_media_update" on public.jersey_media for update using (true) with check (true);
create policy "jersey_media_delete" on public.jersey_media for delete using (true);

-- Storage RLS — public read/write on the 'media' bucket.
-- Admin passcode in the UI is the soft gate; for true admin-only writes
-- later, swap these with policies requiring auth.uid() is not null.
drop policy if exists "media_select" on storage.objects;
drop policy if exists "media_insert" on storage.objects;
drop policy if exists "media_update" on storage.objects;
drop policy if exists "media_delete" on storage.objects;
create policy "media_select" on storage.objects for select using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert with check (bucket_id = 'media');
create policy "media_update" on storage.objects for update using (bucket_id = 'media') with check (bucket_id = 'media');
create policy "media_delete" on storage.objects for delete using (bucket_id = 'media');

alter publication supabase_realtime add table public.jersey_media;

-- ============================================================
-- 8. CUSTOMER REVIEWS — admin-curated real reviews with photo/video
-- ============================================================
create table if not exists public.customer_reviews (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  location      text,
  rating        integer not null check (rating between 1 and 5),
  review_text   text not null,
  purchase_info text,
  photo_url     text,
  photo_path    text,
  video_url     text,
  video_path    text,
  approved      boolean default true,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);
create index if not exists customer_reviews_approved_idx
  on public.customer_reviews (approved, sort_order desc, created_at desc);

alter table public.customer_reviews enable row level security;

drop policy if exists "reviews_read"   on public.customer_reviews;
drop policy if exists "reviews_insert" on public.customer_reviews;
drop policy if exists "reviews_update" on public.customer_reviews;
drop policy if exists "reviews_delete" on public.customer_reviews;
create policy "reviews_read"   on public.customer_reviews for select using (approved = true);
create policy "reviews_insert" on public.customer_reviews for insert with check (true);
create policy "reviews_update" on public.customer_reviews for update using (true) with check (true);
create policy "reviews_delete" on public.customer_reviews for delete using (true);

alter publication supabase_realtime add table public.customer_reviews;
