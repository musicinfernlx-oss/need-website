# NEED V10 — Supabase activation
The landing page remains hosted on GitHub Pages, keeping V9's look. V10 adds optional Supabase email magic-link authentication and cloud draft CRUD.

1. Create your own Supabase project at https://supabase.com/dashboard .
2. In **SQL Editor**, run `supabase/schema.sql` in full. Enable email authentication.
3. In **Authentication → URL Configuration**, set the Site URL to `https://musicinfernlx-oss.github.io/need-website/` and add it to **Redirect URLs**.
4. Copy the **Project URL** and **publishable/anon key** from the project API keys settings. Edit `config.js` in this repository. The **publishable/anon** key is intended for browsers. NEVER use a secret or service_role key in a public site.
5. Reload the site. Choose **My account** and enter your email for a sign-in link. Requests will now be saved in your account in Supabase. Existing local-only drafts stay on this device and are not silently uploaded.
6. In production, review RLS policies and use the Supabase database test tools to check that other users cannot read, edit or delete someone else's drafts.

Until configured, the site remains a working **local prototype**, clearly labeled as such; login stays disabled. GitHub Pages cannot itself store accounts or requests server-side.
