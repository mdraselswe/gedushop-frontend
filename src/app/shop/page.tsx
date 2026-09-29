import type { Metadata } from "next";
import ShopClient from "@/components/ShopClient";
import { getCategories, getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";

export const metadata: Metadata = {
  title: "সকল বেবি প্রোডাক্ট ও বাচ্চাদের খেলনা — All Baby Products & Kids Toys",
  description:
    "GeduShop-এ ব্রাউজ করুন বাচ্চাদের সেরা খেলনা (Kids Toys), বেবি ড্রেস ও প্রয়োজনীয় কিডস আইটেম। সাশ্রয়ী দাম ও সারা দেশে ক্যাশ অন ডেলিভারি।",
  keywords: [
    "বাচ্চাদের খেলনা",
    "babuder khelna",
    "baby toys bd",
    "kids toys online",
    "baby cloth bd",
    "baby shop bangladesh",
  ],
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
