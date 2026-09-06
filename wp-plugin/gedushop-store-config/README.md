# GeduShop Store Configuration

The unique `gedushop-store-config/gedushop-store-config.php` plugin basename
avoids stale activation references from older packages.

After activation, open **WooCommerce → GeduShop Settings**. The screen controls:

- Inside Dhaka delivery charge
- Outside Dhaka delivery charge
- Free-delivery minimum for both zones
- Route-based popup modals for the storefront
- All coupons remain fully managed from WooCommerce Marketing > Coupons.

Saving updates the real WooCommerce shipping methods. The headless
storefront reads the same values from the public read-only endpoint:

`/wp-json/gedushop/v1/store-settings`

Popup settings are exposed from:

`/wp-json/gedushop/v1/popups`

Each popup slot supports:

- enabled/disabled
- one route pattern per line
- title and message
- optional background image URL
- optional button label and URL
- frequency: every visit, once per browser session, or once until content changes

Route examples:

- `/` shows on the homepage only
- `/product/*` shows on every product page
- `/product/sticky-wall-crawler-spider-man/` shows on one product
- `/category/toys/*` shows on a category and its child paths
- `*` shows on every page

The plugin identifies the shipping zones by their current exact names,
`Dhaka` and `Outside Dhaka`. Do not rename those zones without updating this
plugin. If a required method is missing, saving stops with an error instead of
silently updating only half the policy.
