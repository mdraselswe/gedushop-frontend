# GeduShop Product Search

Free, self-hosted product search for the headless storefront. It adds:

- weighted relevance across title, SKU, aliases, tags, categories, attributes and descriptions;
- editable English, Bangla and Banglish synonym groups;
- limited English typo tolerance and prefix matching;
- product-level **Search aliases** under **Product data → General**;
- the public endpoint `/wp-json/gedushop/v1/product-search`;
- compatibility with the storefront's category, sale, stock, price, sort and pagination controls.

## Install

Zip the `gedushop-product-search` directory so that this README and
`gedushop-product-search.php` are directly inside the top-level plugin folder.
Upload it from **Plugins → Add New → Upload Plugin**, activate it, then visit
**WooCommerce → Product Search**.

The first search builds an index from existing published products. Product,
category and tag updates invalidate it automatically. No external search
service, API key or recurring fee is required.

The storefront automatically falls back to WooCommerce's original title/SKU
search if this plugin is not installed or its endpoint is temporarily
unavailable.
