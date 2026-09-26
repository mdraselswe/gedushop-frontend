# GeduShop Product Search

Free, self-hosted product search for the headless storefront. It adds:

- weighted relevance across title, SKU, aliases, tags, categories, attributes and descriptions;
- editable English, Bangla and Banglish synonym groups;
- conservative English typo tolerance restricted to titles and search aliases;
- precision safeguards so incidental description text cannot create a result;
- curated English, Bangla and Banglish aliases generated from product type and
  category for both current and future products;
- an additive, idempotent catalogue migration with preview and JSON backup;
- product-level **Search aliases** under **Product data → General**;
- the public endpoint `/wp-json/gedushop/v1/product-search`;
- compatibility with the storefront's category, sale, stock, price, rating,
  free-delivery, declared-age, discount sort and pagination controls;
- a lightweight filter-options endpoint that only exposes age choices actually
  assigned to products, so the storefront never invents or shows empty age groups.

## Install

Zip the `gedushop-product-search` directory so that this README and
`gedushop-product-search.php` are directly inside the top-level plugin folder.
Upload it from **Plugins → Add New → Upload Plugin**, activate it, then visit
**WooCommerce → Product Search**.

The first search builds an index from existing published products. Product,
category and tag updates invalidate it automatically. No external search
service, API key or recurring fee is required.

## Catalogue migration

Open **WooCommerce → Product Search** after installing an update. Review the
alias preview, download the current search-data backup, then select **Apply safe
catalogue migration**. Existing aliases are preserved, a server-side backup is
saved before the first migration, and repeat runs do not add duplicates. The
curated rules remain active for future products even after the current catalogue
has been migrated.

The storefront automatically falls back to WooCommerce's original title/SKU
search if this plugin is not installed or its endpoint is temporarily
unavailable.
