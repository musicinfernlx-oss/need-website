# NEED V14 — first genuine live product integration

The website can display actual eBay Browse listings returned from the official eBay Browse API after provider credentials and the Supabase Edge Function are deployed. There are **no fabricated products**. The existing single **What do you need?** text input is used for queries, specifications and budget. Sponsored, approved NEED merchants still appear before relevant non-NEED eBay products; price caps filter both.

## Why server-side
The eBay Browse API requires an OAuth application access token derived from an eBay developer Client ID and Client Secret. **NEVER** put credentials, tokens, or any service key in GitHub Pages. The function keeps credentials in deployment secrets and obtains short-lived application tokens.

## Deployment steps (necessary)
1. Register for eBay Developer Program (https://developer.ebay.com/) and request production Buy Browse API permissions. Availability/eligibility depends on eBay approvals and account status.
2. Configure your Supabase project per `supabase/SETUP.md`. Populate `config.js` with **public** Project URL and publishable/anon key, never any secrets.
3. Deploy the function in `supabase/functions/product-search/index.ts` as `product-search`. Ensure appropriate JWT authorization, per-IP/user rate limits and quota controls. The demonstration function checks Origin but Origin is not authentication; use robust rate limiting at the edge before making the endpoint public.
4. Add `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` to Supabase Edge Function secrets.
5. Test with `laptop` and `gaming laptop max 1500€` from NEED's single input. Product cards show real eBay listing title, image, seller price and direct product URL if the API succeeds.
6. Validate shipping to Finland and taxes before building a checkout. The price from the marketplace may exclude delivery and customs fees. Do not promise lowest total cost until shipping, VAT and delivery are verified.

The eBay adapter uses **EBAY_DE** (EUR). Search availability, locale and actual shipping to FI depend on eBay Browse API rules. Price filtering is strict for known EUR prices; other currencies or unknown prices are excluded for budgeted searches. The website retains external shopping search links when live integration is not configured.

## Limitations
Until YOU supply the developer credentials and Supabase infrastructure, the real-time eBay connection is NOT active in the deployed GitHub Pages site. Links to external sites are functional without the API. Paid merchant ranking is backend-ready but no payments or merchant approvals are currently connected.
