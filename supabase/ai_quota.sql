-- NEED V12 AI rate quota: run in Supabase SQL Editor after schema.sql.
create table if not exists public.need_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null default (now() at time zone 'utc')::date,
  calls integer not null default 0 check (calls >= 0),
  primary key (user_id,usage_day)
);
alter table public.need_ai_usage enable row level security;
revoke all on public.need_ai_usage from anon, authenticated;
create or replace function public.need_claim_ai_request()
returns boolean language plpgsql security definer set search_path = ''
as $$
declare claimed integer;
begin
  if (select auth.uid()) is null then return false; end if;
  insert into public.need_ai_usage(user_id,usage_day,calls)
  values ((select auth.uid()),(now() at time zone 'utc')::date,1)
  on conflict (user_id,usage_day) do update
    set calls = public.need_ai_usage.calls+1
    where public.need_ai_usage.calls < 8
  returning calls into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.need_claim_ai_request() from public, anon;
grant execute on function public.need_claim_ai_request() to authenticated;
