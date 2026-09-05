import type { Metadata } from "next";
import ShopClient from "@/components/ShopClient";
import { getCategories, getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";

export const metadata: Metadata = {
  title: "Shop Baby Products, Kids Toys & Essentials Online",
  description:
    "Browse baby products, educational toys, feeding essentials, nursery items and kids accessories online at GeduShop. Cash on delivery across Bangladesh.",
  alternates: { canonical: "/shop/" },
};

export default async function ShopPage() {
  // The canonical shop page must contain products before JavaScript runs. The
  // client controller still reads query parameters after hydration, preserving
  // the existing search and filter experience on static hosting.
  const [{ products, total }, categories] = await Promise.all([
    getProductsPaged({ perPage: 24, orderby: "popularity" }),
    getCategories(),
  ]);

  return <ShopClient initialProducts={productCardPayloads(products)} initialTotal={total} categories={categories} />;
}
