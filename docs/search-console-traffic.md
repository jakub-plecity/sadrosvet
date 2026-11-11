# Google Search Console – Návštěvnost

The admin **Návštěvnost** tab reads **cached data only** from `GET /api/admin/traffic` (admin session required).

## One Search Console request per UTC day

Netlify scheduled function `netlify/functions/search-console-daily.mjs` is configured at **05:15 UTC daily**. It claims the UTC date by inserting into `search_console_sync` with a unique date key **before making any Google request**. A second invocation on the same UTC date exits without calling Search Console, even if the first failed. This is a hard cap, rather than a retryable throttle. OAuth token exchange is a separate Google authorization request, not a Search Console data request.

One **Search Analytics** API request obtains 90 days of daily totals including provisional recent days (clicks, impressions, CTR, position). The app saves individual date rows in Supabase. 7/28/90-day views are computed locally from that cache; viewing the dashboard cannot trigger an API fetch to Google. Google generally publishes search-performance data with a delay; the query ends yesterday UTC and uses `dataState: "all"`, so recent values may be provisional and updated by later daily syncs. The system intentionally does not make separate queries for searches or individual pages, to respect the one-data-request budget.

## Setup required before live sync

1. In Google Cloud create a project, enable the **Google Search Console API**, create a **service account**, and generate a JSON private key.
2. In Google Search Console, open the verified property for `sadrosvet.cz`. Under **Settings → Users and permissions**, add the service account's `client_email` as a user with sufficient read access.
3. In Netlify > Environment variables, add:
   - `GSC_SITE_URL=sc-domain:sadrosvet.cz` for a verified domain property. If the verified property is a URL-prefix property, use its exact name, e.g. `https://sadrosvet.cz/`.
   - `GSC_SERVICE_ACCOUNT_EMAIL` from the service account JSON's `client_email`.
   - `GSC_PRIVATE_KEY` from the JSON's `private_key` (PEM); escaped `\\n` newlines are supported.
4. Deploy with the new migration `db/migrations/20261111110000_search_console_traffic.sql`. Production prebuild applies it through `scripts/verify-supabase-production.mjs`.
5. Check the **Návštěvnost** tab after the next scheduled sync. A sync error appears as a status; the service will not retry until the next UTC day, in accordance with the strict API request limit.

**Security:** Secrets stay in Netlify environment variables (never `NEXT_PUBLIC_`). Data API requires valid admin session. Raw database tables are not exposed to anonymous or authenticated Supabase API roles.

**Note:** Search Console reports organic Google Search performance, **not all website visits**. To report all visits, add dedicated analytics (e.g. GA4) as a separate integration.
