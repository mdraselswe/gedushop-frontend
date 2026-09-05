import type { Metadata } from "next";
import BannerSlider from "@/components/BannerSlider";
import ProductBrowser from "@/components/ProductBrowser";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrustBar from "@/components/TrustBar";
import HomeSeoContent from "@/components/HomeSeoContent";
import { getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";

export const metadata: Metadata = {
  title: "Baby Items, Toys, Baby Clothing & Kids Essentials Online",
  description:
    "Shop baby items, toys, baby clothing and kids essentials online in Bangladesh at GeduShop. Cash on delivery all over the country — genuine, quality-checked products at the best price.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { products, total } = await getProductsPaged({ perPage: 24, orderby: "popularity" }).catch(() => ({
    products: [],
    total: 0,
    totalPages: 1,
  }));

  return (
    <div className="space-y-6 px-4 pb-4 pt-4">
      <BannerSlider />
      <TrustBar />
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-plum-800 md:text-2xl">
            Popular right now
          </h2>
          <p className="text-sm text-plum-400">Loved by parents this week</p>
        </div>
        <ProductBrowser initialProducts={productCardPayloads(products)} initialTotal={total} defaultSort="popularity" />
      </section>
      <HomeSeoContent />
      <RecentlyViewed />
    </div>
  );
}
