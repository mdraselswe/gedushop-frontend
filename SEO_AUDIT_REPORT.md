# GeduShop SEO Audit Report

Audit date: 5 September 2026  
Scope: `gedushop-frontend` source, generated static output, live `https://gedushop.com`, robots.txt, sitemap.xml, representative page HTML, redirect behavior, and current search-result samples.

## Executive summary

GeduShop is crawlable and Google has indexed several product pages. The problem is not a site-wide block or missing sitemap. The main issue is that the site has good product-detail SEO but weak collection/homepage SEO and several conflicting URL/indexing signals. Broad phrases such as “baby items”, “kids products”, and “baby toys” are also highly competitive; metadata alone will not rank a young/low-authority store for them.

The highest-impact defects are:

1. `/shop/` is client-rendered. Its initial HTML contains no products and no H1; a currently surfaced Google result for `?displayview=list` was interpreted as “No products found”.
2. Every tested non-home sitemap URL redirects from the non-trailing-slash URL in the sitemap to a trailing-slash URL, while page canonicals use trailing slashes. In a 30-URL sample, 29 were HTTP 308 and only the homepage returned 200 directly.
3. The homepage has no H1 and almost no durable, descriptive category/intent content. Its first product grid is crawlable, but the main topic is not expressed in a primary on-page heading.
4. Shop filters/pagination are JavaScript buttons/state, not crawlable URL links. Products after the first 24 in a large category have weak discovery/internal-link paths (the sitemap remains a fallback).
5. Search, sort, and display query variants are not canonicalized/noindexed consistently. Google has already selected an unhelpful query URL as a search result.
6. Cart, checkout, wishlist, my-orders, and tracking pages do not emit `noindex`. Robots.txt disallowing only cart/checkout crawling is not an indexing directive.
7. `www.gedushop.com` returns 200 instead of permanently redirecting to the apex domain. The HTML canonical helps, but a single host enforced at the edge is cleaner and consolidates signals faster.
8. Broad category and homepage content is much thinner than visible competitors. There is no editorial/helpful-content cluster (age guides, buying guides, safety/material guides) earning topical relevance and links.

## What is already correct

- HTTPS works and HTTP permanently redirects to HTTPS.
- Google is allowed to crawl the site; the live robots file declares `search=yes` and `Allow: /`.
- A root sitemap is advertised in robots.txt and currently contains 131 URLs.
- Product and category pages are statically rendered with real HTML.
- Product pages have unique titles, descriptions, canonical tags, Product schema, Offer data, breadcrumbs, stock, price, and visible product descriptions.
- Category pages have unique metadata, an H1, canonical tags, breadcrumbs, and server-rendered first-page products.
- The homepage has a canonical tag, useful title/description, product links in initial HTML, and Organization/WebSite schema.
- Google search samples found multiple `gedushop.com/product/...` pages, so this is not a blanket deindexing or robots problem.

## Detailed findings and fixes

### P0 — Fix the shop page's empty initial HTML

`src/app/shop/page.tsx` is a client component and fetches products after hydration. The deployed `/shop/` response contains no product links and no server-rendered H1. This also allows arbitrary search/sort query URLs to return effectively the same empty shell to a crawler.

Fix:

- Make `shop/page.tsx` a server component that reads `searchParams`, fetches the first product page and categories at build/server time, and passes them to a small client filter component.
- For a fully static export, make the canonical `/shop/` contain a server-rendered default list. Treat internal search URLs separately; search-result pages should normally be `noindex,follow`.
- Add unique shop metadata and a canonical of `/shop/` for the default page.
- Ensure an API failure cannot publish “No products found” as the indexable fallback.

### P0 — Make sitemap URLs final 200 canonical URLs

`next.config.ts` sets `trailingSlash: true`, but `src/app/sitemap.ts` creates most URLs without the ending slash. Live requests confirm those entries redirect with 308; representative canonicals include the slash.

Fix:

- Emit `/shop/`, `/category/{slug}/`, `/product/{slug}/`, and all other directory-style URLs with trailing slashes in the sitemap.
- Add `lastModified` from real product/category modification data where available. Do not invent current timestamps on each build.
- After deployment, validate all sitemap locations automatically: each must return 200, be indexable, and self-canonicalize to the exact same URL.
- Resubmit the sitemap in Search Console.

### P0 — Canonicalize parameter URLs and stop low-value indexation

The only surfaced shop result in the initial audit was `/shop?displayview=list`, and its indexed rendering said “No products found”. The app itself does not define `displayview`; this is likely an old or externally discovered parameter. Search/sale/sort URLs can create many duplicate or thin variants.

Fix:

- Default `/shop/`: self-canonical and indexable.
- Internal search (`?search=`): `noindex,follow`; do not include in sitemap.
- Sort/display parameters: canonical to the clean collection URL and preferably strip obsolete parameters with an edge redirect.
- Only index curated filters that have real search demand, unique copy, stable inventory, and a dedicated clean URL.
- Review Search Console's indexed/not-indexed parameter URLs after deployment.

### P1 — Add a real homepage H1 and intent-matched content

The live homepage has zero H1 elements. The hero uses H2, while the product section is “Popular right now”. The title tag targets the right terms, but the visible body gives Google and shoppers little explanation of why this is a useful baby/kids store in Bangladesh.

Fix:

- Add one natural H1, for example: “Baby Products, Kids Toys & Essentials Online in Bangladesh”.
- Add concise, genuinely useful homepage copy beneath the key categories: what is sold, age ranges, product-safety/quality process, delivery coverage, payment and return expectations.
- Link descriptively to the most valuable category and guide pages.
- Do not repeat keyword variants mechanically.

### P1 — Replace button-only pagination with crawlable pages

`ProductBrowser` changes page in React state and `ClientPager` uses `<button>`. Crawlers discover URLs primarily through links and cannot use these controls as a dependable path to later items.

Fix:

- Introduce real URLs such as `/category/toys/page/2/` (best for a static export) or `?page=2` with `<a href>`/Next `Link` elements.
- Give each page a self-canonical. Do not canonicalize all paginated pages to page 1 if their products differ.
- Link pages sequentially and keep each product reachable through navigation, not only the sitemap.

### P1 — Noindex private and transactional pages

Live cart, wishlist, my-orders, and tracking pages returned 200 without a robots meta directive. These have little or no standalone search value and may expose empty/thin states.

Fix:

- Add `robots: { index: false, follow: false }` to checkout/account/order pages and `noindex,follow` where following links is useful.
- Candidate list: `/cart/`, `/checkout/`, `/checkout/success/`, `/wishlist/`, `/my-orders/`, `/track/` and internal search results.
- Do not rely on robots.txt alone to remove a URL from the index; Google must be allowed to crawl a page to see its `noindex`.

### P1 — Strengthen category landing pages

Category metadata is formulaic and the visible intro falls back to one short delivery sentence when WooCommerce has no category description. Generic phrases require better intent coverage.

Fix:

- Write unique category copy based on what parents need: age suitability, materials/safety, how to choose, price ranges, delivery and FAQs.
- Add category-specific FAQ content only when it is visible and genuinely useful; add FAQ schema only if it remains eligible under Google's current rules.
- Split overly broad “Toys” intent into clean, useful subcategories such as educational toys, infant sensory toys, pretend-play toys, and toys by age—only where inventory supports them.

### P1 — Build topical authority and links

The audited app has product/category/legal pages but no learning center or buying-guide content. Competitors visible for broad terms have richer landing copy, age/category coverage, and editorial guides. Generic commercial keywords are won through relevance, reputation, links, reviews, and time—not meta keywords.

Fix:

- Publish a small number of expert-reviewed Bangla/English guides tied directly to inventory: toys by age, BPA/material safety, newborn feeding essentials, gift guides by budget, developmental-play guides.
- Add author/reviewer identity, update dates, original photos or testing notes, and internal links to relevant collections/products.
- Earn legitimate mentions from parenting communities, suppliers/brands, local directories, media, and partners. Never buy bulk spam links.
- Create/complete Google Business Profile if there is a customer-facing or service-area business that meets Google's eligibility rules; keep business name, phone, and address/service data consistent.

### P2 — Improve merchant structured data

Current Product schema is a good base. It can be expanded for richer merchant results.

Fix:

- Add Organization-level `hasMerchantReturnPolicy` and shipping policy data that exactly match visible policy pages.
- Add `shippingDetails`, product `brand` when real, and appropriate identifiers (`gtin`, `mpn`) when available.
- Model variable products with ProductGroup/variant markup where the catalog has genuine variants.
- Validate representative pages with Rich Results Test and monitor Merchant listings in Search Console.

### P2 — Enforce one hostname

Both apex and `www` currently return full pages with 200. Canonicals point to apex, but the alternative host should not remain a separate serving origin.

Fix: configure a Cloudflare 301/308 redirect from every `www.gedushop.com/*` URL to the exact `https://gedushop.com/*` path/query.

### P2 — Reduce page weight and monitor Core Web Vitals

The homepage HTML response measured about 529 KB before compression and carries many product records/Next payload data. That is unusually heavy for 24 cards and can hurt low-end mobile rendering even if transfer compression reduces network bytes.

Fix:

- Pass a smaller product-card DTO to client components rather than the complete WooCommerce object/extension payload.
- Keep only fields required by the initial grid; lazy-load quick-view/detail data.
- Set effective immutable caching for hashed Next assets and sensible CDN caching/revalidation for static HTML.
- Measure mobile LCP, INP, and CLS with Search Console field data and Lighthouse after deployment. The public PageSpeed API was quota-blocked during this audit, so no synthetic score is claimed here.

## Recommended implementation order

### Days 1–3

1. Server-render `/shop/` with products, H1, metadata, and canonical.
2. Correct all sitemap URLs to their final trailing-slash canonical forms.
3. Add noindex rules for search/private/transactional pages.
4. Redirect `www` to apex and obsolete `displayview` URLs to clean equivalents.
5. Add homepage H1 and useful introductory/category copy.

### Week 1–2

1. Implement crawlable category/shop pagination.
2. Write unique copy for the highest-value 3–5 category pages.
3. Add merchant return/shipping structured data and validate it.
4. Compress the serialized client payload and verify mobile Core Web Vitals.

### Month 1–3

1. Publish 2–4 high-quality, inventory-linked guides per month.
2. Develop legitimate local/parenting/brand citations and links.
3. Improve real customer review acquisition and product review depth.
4. Expand only the subcategories supported by keyword demand and inventory.

## Search Console verification checklist

This code/live audit cannot see private Search Console data, which is necessary to distinguish discovered, crawled, indexed, and ranking states precisely.

After fixes:

1. Submit `https://gedushop.com/sitemap.xml`.
2. Inspect homepage, `/shop/`, top categories, and 5–10 priority products.
3. Confirm “URL is on Google”, rendered HTML contains products, declared/user canonical match, and indexing is allowed.
4. Check Page Indexing reasons: Crawled—currently not indexed, Discovered—currently not indexed, Duplicate without user-selected canonical, Soft 404, and Redirect.
5. Export Performance data by query/page/country/device for the last 3 months. Track impressions before position; new sites often gain impressions before first-page rankings.
6. Monitor Merchant listings/Product snippets enhancements and Core Web Vitals.

## Realistic ranking expectation

Technical fixes make pages eligible and easier to understand; they do not guarantee page-one rankings. “Baby items”, “kids products”, and “baby toys” are broad head terms against established stores and marketplaces. The practical early target is long-tail transactional queries—specific product + “price in Bangladesh”, category + age/material, and Bangla equivalents—then use sales, reviews, useful guides, internal linking, and earned authority to move toward broader terms over several months.

