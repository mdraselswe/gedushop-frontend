/** WooCommerce Store API (`/wp-json/wc/store/v1`) shapes — only fields we use. */

export interface StoreImage {
  id: number;
  src: string;
  thumbnail: string;
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
}

export interface StoreReview {
  id: number;
  product_id: number;
  reviewer: string;
  review: string; // may contain HTML
  rating: number;
  date_created: string;
  verified: boolean;
}

export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: StoreImage | null;
}

export interface CartItemTotals {
  line_total: string;
  currency_minor_unit: number;
}

export interface CartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  images: StoreImage[];
  prices: StorePrices;
  totals: CartItemTotals;
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
