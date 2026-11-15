-- NEED V13.1 paid placement model.
-- Only trusted administrators may grant an active paid subscription after verifying payment.
-- Until a payment provider and webhook are connected, every seller defaults to inactive.
alter table public.seller_profiles
 add column if not exists subscription_status text not null default 'inactive'
 check (subscription_status in ('inactive','trialing','active','past_due','canceled'));
alter table public.seller_profiles
 add column if not exists subscription_updated_at timestamptz not null default now();
-- Sellers cannot modify subscription status. Revoke blanket insert/update, grant only safe fields.
revoke insert,update on public.seller_profiles from authenticated;
grant insert (id,business_name,description,location,website) on public.seller_profiles to authenticated;
grant update (business_name,description,location,website) on public.seller_profiles to authenticated;
-- Existing registration code must not send status:'pending' because insert privileges are restricted.
-- Seller approval remains controlled by administrators.
create index if not exists seller_profiles_subscription_idx
 on public.seller_profiles(status,subscription_status);

-- Example *admin-only* activation after validated payment:
-- update public.seller_profiles set subscription_status='active', subscription_updated_at=now()
-- where id='ACTUAL_SELLER_UUID' and status='approved';

-- IMPORTANT:
-- Do not allow the browser to set subscription_status.
-- Enforce billing state in a secure webhook / service backend before production.
-- All sponsored cards are marked as such. Paid priority applies only after a buyer's
-- price ceiling and keyword matching conditions are met.
