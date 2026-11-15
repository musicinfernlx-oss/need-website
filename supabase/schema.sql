-- NEED V10: private buyer requests. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  description text not null check(char_length(description) between 10 and 2000),
  category text not null default 'Products & services' check(char_length(category) <= 80),
  budget text not null default '' check(char_length(budget) <= 60),
  timeline text not null default 'Flexible' check(char_length(timeline) <= 60),
  location text not null default '' check(char_length(location) <= 100),
  status text not null default 'draft' check(status in ('draft','published','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists needs_user_id_created_at_idx on public.needs(user_id,created_at desc);
alter table public.needs enable row level security;
revoke all on public.needs from anon;
revoke all on public.needs from authenticated;
grant select,insert,update,delete on public.needs to authenticated;
drop policy if exists "needs_owner_select" on public.needs;
drop policy if exists "needs_owner_insert" on public.needs;
drop policy if exists "needs_owner_update" on public.needs;
drop policy if exists "needs_owner_delete" on public.needs;
create policy "needs_owner_select" on public.needs for select to authenticated using((select auth.uid()) = user_id);
create policy "needs_owner_insert" on public.needs for insert to authenticated with check((select auth.uid()) = user_id);
create policy "needs_owner_update" on public.needs for update to authenticated using((select auth.uid()) = user_id) with check((select auth.uid()) = user_id);
create policy "needs_owner_delete" on public.needs for delete to authenticated using((select auth.uid()) = user_id);
-- Optional: later add validated published request visibility and seller policies.
-- Do not expose private drafts to anonymous or seller users.
