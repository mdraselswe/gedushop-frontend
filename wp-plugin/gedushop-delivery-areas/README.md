# GeduShop Delivery Areas

Charges the outlying areas of the **Dhaka district** the outside-Dhaka
delivery rate. Only **Dhaka Sadar** is inside the city.

## Why

WooCommerce chooses a shipping zone from country + state alone. The whole
Dhaka district is one state code (`BD-13`), so Savar, Dhamrai, Keraniganj,
Nawabganj and Dohar would all take the inside-Dhaka rate — although they cost
the same to reach as any other district.

This plugin rewrites the *shipping package's* state for those areas so Woo
matches the outside-Dhaka zone instead. The order still records the address
the customer gave; only the price lookup is redirected. The charge itself
stays where it already is — the zone's own rate, with the zone's own
free-delivery threshold.

## Install

1. Copy the `gedushop-delivery-areas` folder into `wp-content/plugins/`.
2. Activate **GeduShop Delivery Areas** in Plugins.

No settings page. Requires the two shipping zones the shop already has: a
"Dhaka" zone matching state `BD-13`, and an outside-Dhaka zone every other
district falls to.

## The areas

The storefront's dropdown (`src/lib/districts.ts` → `DHAKA_AREAS`) offers:

| Area        | Rate           |
| ----------- | -------------- |
| Dhaka Sadar | inside Dhaka   |
| Savar       | outside Dhaka  |
| Dhamrai     | outside Dhaka  |
| Keraniganj  | outside Dhaka  |
| Nawabganj   | outside Dhaka  |
| Dohar       | outside Dhaka  |

The inside rate belongs to exactly one pair: district Dhaka **and** area Dhaka
Sadar. Every other combination is outside Dhaka — including a Dhaka address
carrying no area at all, or one that says only `Dhaka` (an order typed in
wp-admin, or placed before the checkout asked for an area).

So add or remove an area in that list freely; anything that is not Dhaka Sadar
is priced as outside Dhaka without a change here.
