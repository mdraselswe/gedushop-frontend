# GeduShop Headless SEO

The WooCommerce site at `wp.gedushop.com` is an API/admin backend. Its public
theme pages duplicate products that already have canonical storefront pages at
`gedushop.com`, and Google has indexed at least one backend product URL.

This plugin:

- adds `noindex, follow` as both HTML robots metadata and an HTTP header on
  public WordPress pages;
- disables WordPress core's duplicate sitemap;
- leaves wp-admin, REST/Store API calls, cron, feeds, checkout API calls and
  webhooks unchanged;
- does not redirect product pages, because a newly published WordPress product
  can exist before the next static frontend deployment. An automatic redirect
  during that interval would send shoppers and crawlers to a frontend 404.

## Install

1. Upload `gedushop-headless-seo.zip` in **WordPress → Plugins → Add New → Upload Plugin**.
2. Activate **GeduShop Headless SEO**.
3. Open one `wp.gedushop.com/product/...` page while logged out and confirm its
   response includes `X-Robots-Tag: noindex, follow` and its HTML includes a
   robots `noindex` meta tag.
4. Request removal/recrawl of already indexed backend URLs in Search Console.

Do not block these pages in robots.txt until Google has recrawled and seen the
`noindex` directive. Blocking first can leave old URLs indexed because Google
cannot fetch the directive.
