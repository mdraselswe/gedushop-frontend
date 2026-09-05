# GeduShop Store Configuration

The unique `gedushop-store-config/gedushop-store-config.php` plugin basename
avoids stale activation references from older packages.

After activation, open **WooCommerce → GeduShop Settings**. The screen controls:

- Inside Dhaka delivery charge
- Outside Dhaka delivery charge
- Free-delivery minimum for both zones
- All coupons remain fully managed from WooCommerce Marketing > Coupons.

Saving updates the real WooCommerce shipping methods. The headless
storefront reads the same values from the public read-only endpoint:

`/wp-json/gedushop/v1/store-settings`

The plugin identifies the shipping zones by their current exact names,
`Dhaka` and `Outside Dhaka`. Do not rename those zones without updating this
plugin. If a required method is missing, saving stops with an error instead of
silently updating only half the policy.
