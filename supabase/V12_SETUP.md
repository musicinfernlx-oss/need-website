# NEED V12 — activation

The website works now without a backend: Finnish/English keyword-based intent recognition, guided product types, illustrative product photographs and local request drafts. Photographs load from Unsplash with visual fallbacks; these are not product offers or accurate stock pictures of particular models.

To activate **real AI analysis**:
1. Complete `supabase/SETUP.md` with your Supabase project and email sign-in.
2. Run `supabase/ai_quota.sql` in Supabase SQL Editor. The application quota limits each signed-in user to eight AI analyses per UTC calendar day.
3. Deploy `supabase/functions/need-assist/index.ts` as the `need-assist` Edge Function, requiring user JWT authentication.
4. Add `OPENAI_API_KEY` in Supabase Function Secrets, never in the public GitHub repository. Optional `OPENAI_MODEL` changes the model.
5. Sign in at NEED, enter your request, select **Suggest options** and then **Analyze with AI**. Check logs, billing limits, and row-level security.

AI requests may incur provider charges. Set project/API usage budgets. No live merchant inventory, real-time seller prices, checkout or offers are connected. Exact current product matching needs a permitted retailer product feed or partner API.
