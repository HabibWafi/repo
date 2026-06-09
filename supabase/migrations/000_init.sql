-- ============================================================================
-- Personal Asset Archive — initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- ============================================================================

-- Fuzzy search support for ILIKE / trigram indexes.
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- items: unified table for both links and uploaded images
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type          text not null check (type in ('link', 'image')),
  url           text,
  provider      text not null default 'generic'
                  check (provider in ('youtube','tiktok','instagram','generic','image')),
  title         text,
  description   text,
  notes         text,
  thumbnail_url text,
  image_path    text,
  tags          text[] not null default '{}',
  collection    text,
  is_favorite   boolean not null default false,
  embed_html    text,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes ---------------------------------------------------------------------
create index if not exists items_user_created_idx
  on public.items (user_id, created_at desc);
create index if not exists items_tags_gin_idx
  on public.items using gin (tags);
create index if not exists items_title_trgm_idx
  on public.items using gin (title gin_trgm_ops);
create index if not exists items_favorite_idx
  on public.items (user_id) where is_favorite;
create index if not exists items_collection_idx
  on public.items (user_id, collection) where collection is not null;

-- Row Level Security ----------------------------------------------------------
alter table public.items enable row level security;

drop policy if exists "items_select_own" on public.items;
create policy "items_select_own" on public.items
  for select using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own" on public.items
  for insert with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own" on public.items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own" on public.items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded images/screenshots
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('archive', 'archive', false)
on conflict (id) do nothing;

-- Files are stored under "{user_id}/{uuid}.{ext}"; policies match the prefix.
drop policy if exists "archive_select_own" on storage.objects;
create policy "archive_select_own" on storage.objects
  for select using (
    bucket_id = 'archive'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "archive_insert_own" on storage.objects;
create policy "archive_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'archive'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "archive_update_own" on storage.objects;
create policy "archive_update_own" on storage.objects
  for update using (
    bucket_id = 'archive'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "archive_delete_own" on storage.objects;
create policy "archive_delete_own" on storage.objects
  for delete using (
    bucket_id = 'archive'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
