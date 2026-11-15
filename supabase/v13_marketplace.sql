-- NEED V13: buyer-first hybrid marketplace. Run after schema.sql in Supabase SQL Editor.
-- Buyers retain their own drafts; only explicitly published requests are visible to approved sellers.
create table if not exists public.seller_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 business_name text not null check (char_length(business_name) between 2 and 120),
 description text not null default '' check (char_length(description) <= 600),
 location text not null default '' check (char_length(location) <= 120),
 website text not null default '' check (website = '' or website ~* '^https://[^[:space:]]+$'),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.seller_offers (
 id uuid primary key default gen_random_uuid(),
 need_id uuid not null references public.needs(id) on delete cascade,
 seller_id uuid not null references public.seller_profiles(id) on delete cascade,
 title text not null check (char_length(title) between 3 and 140),
 description text not null default '' check (char_length(description) <= 1200),
 price numeric(12,2) not null check (price >= 0),
 currency text not null default 'EUR' check (currency in ('EUR','USD','GBP')),
 product_url text not null default '' check (product_url = '' or product_url ~* '^https://[^[:space:]]+$'),
 created_at timestamptz not null default now(),
 unique (need_id,seller_id)
);
create table if not exists public.merchant_products (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.seller_profiles(id) on delete cascade,
 title text not null check (char_length(title) between 3 and 160),
 summary text not null default '' check (char_length(summary) <= 800),
 category text not null default 'Other' check (char_length(category) <= 80),
 price numeric(12,2) not null check (price >= 0),
 currency text not null default 'EUR' check (currency in ('EUR','USD','GBP')),
 product_url text not null check (product_url ~* '^https://[^[:space:]]+$'),
 image_url text not null default '' check (image_url = '' or image_url ~* '^https://[^[:space:]]+$'),
 active boolean not null default true,
 updated_at timestamptz not null default now()
);
create index if not exists seller_offers_need_idx on public.seller_offers(need_id);
create index if not exists seller_offers_seller_idx on public.seller_offers(seller_id);
create index if not exists merchant_products_seller_idx on public.merchant_products(seller_id);
create index if not exists merchant_products_active_idx on public.merchant_products(active);
alter table public.seller_profiles enable row level security;
alter table public.seller_offers enable row level security;
alter table public.merchant_products enable row level security;
revoke all on public.seller_profiles, public.seller_offers, public.merchant_products from anon, authenticated;
grant select on public.seller_profiles, public.merchant_products to anon;
grant select,insert,update on public.seller_profiles to authenticated;
grant select,insert,update,delete on public.merchant_products to authenticated;
grant select,insert on public.seller_offers to authenticated;
grant select on public.seller_offers to anon;
-- Protect status from seller edits: sellers may register/update their text fields but cannot approve themselves.
revoke update on public.seller_profiles from authenticated;
grant update (business_name, description, location, website) on public.seller_profiles to authenticated;
revoke update on public.needs from authenticated;
grant update (description, category, budget, timeline, location, status) on public.needs to authenticated;
-- Listings are read-only to anonymous customers except approved partner offers with published buyer requests.
drop policy if exists sp_read on public.seller_profiles;
drop policy if exists sp_register on public.seller_profiles;
drop policy if exists sp_edit on public.seller_profiles;
create policy sp_read on public.seller_profiles for select to anon,authenticated using(status='approved' or id=(select auth.uid()));
create policy sp_register on public.seller_profiles for insert to authenticated with check(id=(select auth.uid()) and status='pending');
create policy sp_edit on public.seller_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
drop policy if exists needs_sellers_read_published on public.needs;
create policy needs_sellers_read_published on public.needs for select to authenticated using (
  status='published' and exists (select 1 from public.seller_profiles s where s.id=(select auth.uid()) and s.status='approved')
);
drop policy if exists offers_select on public.seller_offers;
drop policy if exists offers_insert on public.seller_offers;
create policy offers_select on public.seller_offers for select to authenticated using (
 seller_id=(select auth.uid()) or exists (select 1 from public.needs n where n.id=need_id and n.user_id=(select auth.uid()))
);
create policy offers_insert on public.seller_offers for insert to authenticated with check (
 seller_id=(select auth.uid())
 and exists (select 1 from public.seller_profiles s where s.id=(select auth.uid()) and s.status='approved')
 and exists (select 1 from public.needs n where n.id=need_id and n.status='published' and n.user_id<>(select auth.uid()))
);
drop policy if exists products_public on public.merchant_products;
drop policy if exists products_create on public.merchant_products;
drop policy if exists products_update on public.merchant_products;
drop policy if exists products_delete on public.merchant_products;
create policy products_public on public.merchant_products for select to anon,authenticated using (
 active=true and exists (select 1 from public.seller_profiles s where s.id=seller_id and s.status='approved')
 or seller_id=(select auth.uid())
);
create policy products_create on public.merchant_products for insert to authenticated with check (
 seller_id=(select auth.uid()) and exists (select 1 from public.seller_profiles s where s.id=(select auth.uid()) and s.status='approved')
);
create policy products_update on public.merchant_products for update to authenticated using(seller_id=(select auth.uid()))
 with check(seller_id=(select auth.uid()));
create policy products_delete on public.merchant_products for delete to authenticated using(seller_id=(select auth.uid()));
-- Only operators with privileged Supabase admin access should approve sellers manually.
-- Never put service_role in browser code.
