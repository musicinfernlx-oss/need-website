# NEED Global Product Engine

The live backend is Supabase Edge Function `product-search`.
The existing `search.html` and `search.js` request it with `{ query }` and render actual product cards; a click opens the original seller URL.

## Currently supported
- WooCommerce **public Store API**: query `/wp-json/wc/store/v1/products?search=...`, product name, image, link, accurate decimal-currency price conversion and availability status.
- eBay Browse adapter: usable after eBay production application is approved and `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` are set in the Edge Function environment.
- No fake offers, no generated prices, no scraped copyrighted images without permission.

## Enabling a WooCommerce retailer
The Supabase table `public.product_sources` is admin-managed, and RLS prevents anonymous edits. Check the store's terms, robots directives, product-image reuse rights and any contract requirements **before** adding it.

In the Supabase SQL Editor, as a project administrator:

```sql
insert into public.product_sources
 (name, base_url, platform, country, enabled, permission_verified)
values
 ('Retailer name', 'https://retailer.example', 'woocommerce', 'FI', true, true);
```

Only set `permission_verified=true` after actual verification. Do not copy this SQL with a placeholder domain to production.
The product-search function reads only rows where `enabled=true AND permission_verified=true`. Retailer addresses are never supplied by web visitors; HTTPS is required and a max of eight enabled sources are queried per search.

Shopify support is not yet implemented in the deployed function. The registry reserves the platform name for future use. Integration needs correct store-specific price and currency handling and image reuse permission.

## Testing
Search at:
https://musicinfernlx-oss.github.io/need-website/search.html?q=headphones

Before any approved retailer is enabled, the page correctly reports no matching live products and offers external retailer search links.
