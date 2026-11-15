# NEED V13.1 — buyer-first matches with paid partner priority

**Search interaction:** the only search input is the homepage **What do you need?** field. Choose **Find my match** to automatically search connected NEED merchants, and when appropriate Open Library books / Open Food Facts entries. External Google Shopping, eBay and Etsy searches are always offered at the bottom. They are outgoing searches, not scraped live listings.

**Matching rules:** approximate budget ceiling is parsed from the user's request. Catalog products must fit it in EUR; unknown prices and non-EUR prices are excluded when an EUR ceiling is present. Descriptive keyword matching filters irrelevant catalog records. Within qualifying products, paying NEED partners (subscription_status='active') appear first; other approved merchants and open catalog records follow. Sponsored products are clearly marked **Sponsored · NEED partner**. Paid status does not override buyer exclusions.

**Activate:** run `supabase/schema.sql`, `supabase/v13_marketplace.sql`, and then `supabase/v13_paid_placement.sql`. Connect Supabase public URL and publishable key in `config.js`. Set `subscription_status='active'` only using trusted administrative operations after confirming payment. DO NOT allow sellers to change it themselves. Subscription billing / webhooks are not implemented.

**Notes and limits:** This is an early deterministic matching algorithm, not a fully trained AI ranking engine. If a requirement is not in the product feed, it cannot be verified. Open Library/Open Food Facts lack verified live retail prices. Real cross-store comparison and a true 'best offer' require merchant feeds, up-to-date stock, shipping and returns, and a neutral comparison signal. Consider a separate option to sort by lowest total price and explicitly disclose the sponsored placement policy.

**Production checklist:** trustworthy merchant verification, secure subscription billing, regional availability, shipping costs, moderation, refund/consumer rules, anti-abuse protection, and practical RLS tests.
