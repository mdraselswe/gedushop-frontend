/** WooCommerce Store API (`/wp-json/wc/store/v1`) shapes — only fields we use. */

export interface StoreImage {
  id: number;
  src: string;
  thumbnail: string;
  /** Responsive candidates from WP — used for sized <img> since the static export can't run the Next optimizer. */
  srcset?: string;
  sizes?: string;
  alt: string;
}

export interface StorePrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}

export interface StoreCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: StorePrices;
  images: StoreImage[];
  categories: StoreCategoryRef[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  average_rating: string;
  review_count: number;
  attributes?: StoreAttribute[];
  variations?: StoreVariationRef[];
  extensions?: {
    gedushop?: {
      video?: string;
      /** Swatch hex by taxonomy then term slug, e.g. { pa_color: { blue: "#1e73be" } } */
      attribute_colors?: Record<string, Record<string, string>>;
      /**
       * This product ships free on its own — a plain product's own promotion
       * as often as a combo's, so it sits here rather than inside `combo`,
       * which is absent on everything that isn't one.
       */
      free_shipping: boolean;
      /**
       * Present only on a combo — several products sold together at one price.
       *
       * The combo IS an ordinary product here: its own page, its own price, one
       * line in the cart. This is the recipe behind it, so the page can show
       * what is in the box and what the set saves, and so each component's own
       * page can point back at it.
       */
      combo?: StoreCombo;
    };
  };
}

export interface StoreComboItem {
  id: number;
  name: string;
  slug: string;
  /** Pieces of this product in ONE set. */
  qty: number;
  /** Minor units, like every other price the Store API sends. */
  price: number;
  image: string | null;
}

export interface StoreCombo {
  items: StoreComboItem[];
  /** What the same goods list for bought separately, in minor units. */
  components_total: number;
  free_shipping: boolean;
}

export interface StoreAttribute {
  id: number;
  name: string;
  taxonomy: string | null;
  has_variations: boolean;
  terms: { id: number; name: string; slug: string; default?: boolean }[];
}

export interface StoreVariationRef {
  id: number;
  attributes: { name: string; value: string }[];
}

export interface StoreReview {
  id: number;
  product_id: number;
  reviewer: string;
  review: string; // may contain HTML
  rating: number;
  date_created: string;
  verified: boolean;
  photos?: { thumb: string; full: string }[];
}

export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
  image: StoreImage | null;
}

export interface CartItemTotals {
  line_subtotal: string; // before coupon discount (price × qty)
  line_total: string; // after coupon discount
  currency_minor_unit: number;
}

export interface CartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  permalink?: string;
  /** Chosen options for variable products, e.g. [{attribute:"Color", value:"Blue"}] */
  variation?: { attribute: string; value: string }[];
  images: StoreImage[];
  prices: StorePrices;
  totals: CartItemTotals;
  extensions?: {
    gedushop?: {
      /** This basket line ships free on its own — combo or plain product alike. */
      free_shipping: boolean;
      /** Present when this basket line is a combo. */
      combo?: {
        /** "Robotic Aeroplane x1", "AA Battery Pack x3" — what is in the box. */
        includes: string[];
      };
    };
  };
}

export interface CartTotals {
  total_items: string;
  total_price: string;
  total_shipping: string | null;
  total_discount: string;
  currency_minor_unit: number;
}

export interface CartCoupon {
  code: string;
  totals: { total_discount: string; currency_minor_unit: number };
}

export interface ShippingRate {
  rate_id: string;
  name: string;
  price: string;
  selected: boolean;
  currency_minor_unit: number;
}

export interface ShippingPackage {
  package_id: number;
  shipping_rates: ShippingRate[];
}

export interface Cart {
  items: CartItem[];
  items_count: number;
  totals: CartTotals;
  shipping_rates?: ShippingPackage[];
  needs_shipping?: boolean;
  coupons?: CartCoupon[];
}
