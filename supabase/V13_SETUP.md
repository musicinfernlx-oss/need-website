# NEED V13 — Hybrid marketplace setup

**What's already usable with no API keys:** External shopping-site search shortcuts (search opens at the original retailer/search engine), public Open Library book metadata, Open Food Facts grocery metadata, simple in-app comparisons when a catalog returns results, and the existing locally saved buyer drafts. No live product prices are claimed for unconnected sources.

**Enable real NEED merchants, private offers, and cloud requests:**
1. Connect a personal Supabase project per `supabase/SETUP.md`, run `supabase/schema.sql`.
2. Run `supabase/v13_marketplace.sql`. Inspect policies carefully before live production.
3. Set an approved seller status *manually via Supabase's authenticated administrator* after validating the business. Unapproved registrations cannot make offers or publish products.
4. Buyers must sign in and deliberately choose Publish on a request to expose it to approved sellers; drafts remain private. Buyers see resulting offers and can compare them with catalog examples.
5. Approved sellers sign in, open Seller Portal, add products or respond to published requests. Their profile status is not self-approvable.
6. Activate optional AI separately per `supabase/V12_SETUP.md`.

**External product sources:** Book search uses the public Open Library API and groceries use Open Food Facts (open source product metadata). These sources do not provide verified store offers or checkout. For general electronics/fashion users receive clearly labeled outbound searches; real listing API connections (e.g. eBay Browse) need approved API credentials and a secure backend. Do not imply any store joined NEED without confirmation. Always verify partner feed terms, attribution, rate limits, licensing and currency.

**Important:** This commit prepares the schema and browser workflow, but no Supabase instance is connected in `config.js`. No actual seller can register or send offers until that setup happens. GitHub Pages alone does not host a database. Moderation, fraud protection, abuse controls, and policy/legal review are required before accepting real money or open marketplace publication.
