# GeduShop SEO Implementation Report

Completed: 5 September 2026

## Implemented in the Next.js storefront

- `/shop/` now exports real first-page product HTML, a descriptive H1, unique
  metadata and a self-canonical URL. Search, sale and sort behavior remains
  client-side and unchanged for shoppers.
- Added static, crawlable shop and category pagination under `/page/{n}/`.
  Pagination still becomes state-driven when a shopper applies interactive
  filters, preserving the existing filter UX.
- Corrected every sitemap URL to the final trailing-slash canonical form.
  Added paginated collection URLs, added FAQ, removed the private tracking page
  and excluded the low-value Uncategorized collection.
- Added one descriptive homepage H1 without changing the carousel layout.
- Added helpful homepage/category copy and descriptive internal links without
  changing existing navigation, product cards, cart or checkout behavior.
- Added `noindex` to cart, checkout/success, wishlist, order history and order
  tracking pages. Robots.txt now allows crawlers to fetch those directives.
- Added Cloudflare Pages middleware that:
  - redirects `www.gedushop.com` to the apex domain;
  - removes the obsolete `displayview` shop parameter;
  - sends `X-Robots-Tag: noindex, follow` for shop search/sort/filter query URLs.
- Added self-canonicals and descriptions to public informational pages.
- Standardized product/category structured-data URLs to final slash URLs.
- Added Organization customer-service and merchant-return-policy markup.
- Reduced serialized collection payload by stripping unused full descriptions,
  combo recipes and variation references. Generated homepage HTML fell from
  approximately 529 KB live/before to 461 KB after; shop HTML is approximately
  446 KB and now includes its products.

## Implemented for the WordPress backend

Google had indexed public `wp.gedushop.com/product/...` pages, creating a
duplicate headless storefront. A separate installable plugin was created at:

`wp-plugin/gedushop-headless-seo.zip`

When activated it adds `noindex, follow` in both HTML and HTTP headers to the
public WordPress frontend and disables the WordPress core sitemap. It does not
change wp-admin, REST/Store API, feeds, cron, webhooks or checkout API calls.

## Verification completed

- `next build --webpack`: passed; 150 static pages generated.
- TypeScript production check: passed.
- ESLint on all SEO-changed application files: passed.
- Generated HTML checks:
  - homepage: one H1 and 25 product links;
  - shop: one H1 and 25 product links;
  - Toys page 1 and page 2: one H1, products and crawlable pagination links;
  - cart, checkout success and wishlist: robots noindex present.
- Generated sitemap: 136 URLs, zero non-trailing-slash URLs, five paginated
  collection URLs, zero Uncategorized URLs.
- Cloudflare Pages local runtime:
  - clean shop: 200;
  - search query: 200 plus `X-Robots-Tag: noindex, follow`;
  - obsolete display parameter: 301 to clean shop;
  - www request: 301 to apex;
  - static category page 2: 200.
- Full repository lint still reports pre-existing React effect-rule errors in
  unrelated interactive components. They were not changed because rewriting
  checkout, wishlist, gallery, search and persisted-state behavior is outside
  SEO scope and creates feature-regression risk. No changed SEO file has a lint
  error.

## Intentionally not automated, with risks

### Production deployment

Not run automatically. It would immediately replace the live storefront and
activate edge routing changes. Even with a passing build and local Pages smoke
test, deploying without the owner's release decision can affect live orders.
Use the existing deployment command after reviewing the diff and preferably at
a low-order time.

### WordPress plugin activation

The plugin is packaged but cannot take effect until an authorized WordPress
administrator installs and activates it. Activating it will intentionally make
all public `wp.gedushop.com` theme pages disappear from Google over time. The
Store API and admin remain available. Do not add a robots.txt block first:
Google must crawl the duplicate URLs to see `noindex`.

### Redirecting every WordPress product to Next.js

Not implemented. This would transfer signals faster than noindex, but a product
can be published in WordPress before the next static Next.js deployment. During
that interval an automatic redirect would send shoppers and Google to a 404.
Safe redirects require a reliable publish-to-build/deploy webhook with success
verification and rollback.

### Dynamic server-rendered search results

Not possible in the current `output: export` architecture: incoming query
parameters are unknown at build time and there is no Node server. Search remains
functional in the browser and is deliberately noindexed. Moving it to SSR would
require Workers/OpenNext or another runtime, increasing deployment complexity,
cost and cart/API regression surface without a meaningful SEO benefit because
internal search results should not normally be indexed.

### Shipping structured data

Not added. The real charge is Tk 80 only for Dhaka Sadar, Tk 120 elsewhere,
free above Tk 2,000, and some products can ship free independently. Encoding a
single nationwide price would be false; accurately expressing “Bangladesh
except one sub-area” is fragile in merchant markup. Incorrect shipping markup
can cause Rich Results/Merchant Center mismatches or disapproval. Return-policy
markup was safe because it links to the authoritative visible policy page.

### Brand, GTIN and MPN

Not invented. WooCommerce currently does not supply verified identifiers or a
real manufacturer brand for every item. Marking GeduShop as the manufacturer
or fabricating GTIN/MPN values can create merchant-listing errors and is worse
than omitting optional fields. Add them only after storing authentic values in
WordPress and exposing them through the Store API.

### Sitemap last-modified dates

Not fabricated. The current Store API objects used by the build do not expose a
trustworthy modification timestamp. Setting every URL to the build time tells
crawlers that unchanged pages changed on every deploy and wastes crawl signals.

### Search Console actions and ranking guarantees

Code cannot submit private Search Console properties, inspect coverage reasons,
request recrawls or create external authority. After deployment, the owner must
submit the sitemap, inspect priority URLs and monitor query/page reports.
Technical SEO makes pages discoverable and understandable; it cannot guarantee
a position for competitive terms. Original guides, real reviews, business
citations and legitimate backlinks require ongoing editorial/business work.

