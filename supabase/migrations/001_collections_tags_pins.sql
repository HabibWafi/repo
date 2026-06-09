-- ============================================================================
-- Phase 4 — collections & tags catalogs, pin support
-- Run this ONCE in the Supabase SQL Editor (after 000_init.sql).
-- Additive + idempotent; safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- collections: the catalog of folders (incl. empty ones)
-- ---------------------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists collections_user_idx
  on public.collections (user_id, sort_order, name);

alter table public.collections enable row level security;

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own" on public.collections
  for select using (auth.uid() = user_id);
drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own" on public.collections
  for insert with check (auth.uid() = user_id);
drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own" on public.collections
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tags: the catalog of tags (drives the dropdown + management)
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists tags_user_idx on public.tags (user_id, name);

alter table public.tags enable row level security;

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- items: add collection_id (FK) + is_pinned, then backfill & drop old column
-- ---------------------------------------------------------------------------
alter table public.items
  add column if not exists collection_id uuid references public.collections (id) on delete set null;
alter table public.items
  add column if not exists is_pinned boolean not null default false;

-- Backfill collections from any existing text values, then link items.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'items' and column_name = 'collection'
  ) then
    insert into public.collections (user_id, name)
      select distinct user_id, collection
      from public.items
      where collection is not null and btrim(collection) <> ''
      on conflict (user_id, name) do nothing;

    update public.items i
      set collection_id = c.id
      from public.collections c
      where c.user_id = i.user_id and c.name = i.collection;

    alter table public.items drop column collection;
  end if;
end $$;

-- Backfill the tags catalog from existing item tags.
insert into public.tags (user_id, name)
  select distinct user_id, unnest(tags)
  from public.items
  on conflict (user_id, name) do nothing;

create index if not exists items_pinned_created_idx
  on public.items (user_id, is_pinned desc, created_at desc);
create index if not exists items_collection_id_idx
  on public.items (user_id, collection_id);
