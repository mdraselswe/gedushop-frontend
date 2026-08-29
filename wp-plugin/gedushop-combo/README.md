# GeduShop Combo Sets

Turns an ordinary WooCommerce product into a **combo set**: a product whose
price is its own, but whose *stock* belongs to the products inside it.

The rule the whole plugin exists to keep:

> A combo never owns stock. How many sets exist is always
> `min( component stock / quantity per set )`, recalculated from the
> components — never typed in.

So the last robotic aeroplane on the shelf shows as out of stock on the
aeroplane's own page **and** on every combo that contains one, and selling it
either way empties both.

## Install

1. Copy the `gedushop-combo` folder into `wp-content/plugins/`.
2. Activate **GeduShop Combo Sets** in Plugins.
3. Activation schedules a nightly re-sync and builds the component index.

Requires WooCommerce with the Store API (WooCommerce Blocks) — the same
version the headless bridge already needs. No settings page.

## Making a combo

There are two ways in. The first is the normal one.

### From gedusuite (recommended)

1. Build the combo in gedusuite: **Products → Combos → New combo**.
2. For each component, link it to the website product it stands for — the
   picker searches this shop by name, or **Match to website** guesses them all
   at once from SKU and name. Each product only ever has to be linked once.
3. Press **Put on website**. gedusuite creates the product here as a **draft**
   with the price and the recipe already set, and remembers its id.
4. Open the draft in WooCommerce, add the images and description, and publish.
5. Later price or recipe changes: press **Push update** in gedusuite.

A new product is deliberately created as a draft. This writes to a live shop,
and a wrong price should be caught while reviewing rather than by a customer
paying it.

### By hand, in WooCommerce

For a combo gedusuite doesn't know about:

1. Create a normal product with the combo's price, images and description.
2. **Enable "Manage stock"** on it. The plugin writes the number; with stock
   management off there is nothing to write and Woo treats the combo as always
   in stock.
3. In the **GeduShop Combo Set** box, list one component per line:

   ```
   412 x 1     # Robotic Aeroplane
   388 x 3     # AA battery
   ```

   The id is the product id — or the **variation id** when the component is
   one fixed variant of a variable product. Text after `#` is a note.
4. Tick **Free delivery with this combo** if the set carries that promotion.
5. Save. The stock figure is written for you and updates from then on.

Either way: do not edit the combo's own stock quantity by hand — the next
component movement overwrites it.

## What it does behind the scenes

| Moment | What happens |
| --- | --- |
| A component's stock changes | Every combo containing it is recalculated |
| An order is paid | Combo lines reduce the components, not the combo |
| An order is cancelled/refunded | The components are put back |
| Cart validation | Combo demand **plus** loose demand is checked together, so 2 combos + 1 loose aeroplane can't pass with 2 in stock |
| A free-delivery combo in the cart | Shipping rates are zeroed for that order |
| Store API responses | `extensions.gedushop.combo` on both the product and the cart line |
| Nightly | Full re-sync, so anything changed outside WordPress heals itself |

## Meta keys

| Key | Meaning |
| --- | --- |
| `_gedu_combo_items` | `[{id, qty}, …]` — the recipe |
| `_gedu_combo_free_shipping` | `yes` / `no` |
| `_gedu_combo_stock_reduced` | Set on an order once its combo lines have been deducted (makes the deduction idempotent) |
| `gedu_combo_index` (option) | component id → combo ids, so a stock change is O(1) to route |

## Keeping it in step with gedusuite

When a combo is pushed from gedusuite, the website product id is recorded there
automatically — nobody types an id anywhere. gedusuite's combo list then has a
**Check website** button that compares its price, line count and piece count
against this shop and says so when they have drifted apart, which is what
happens when somebody edits the price here instead of there.

A combo built by hand in WooCommerce is invisible to gedusuite unless its id is
filled into the combo's *Website product id* field there.
