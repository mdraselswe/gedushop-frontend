import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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
  // Do not publish an empty homepage when WordPress is temporarily down.
  // The build fetch already retries; if it still fails, keeping the current
  // production deployment is safer than replacing it with "No products".
  const { products, total } = await getProductsPaged({ perPage: 24, orderby: "popularity" });

  return (
    <div className="space-y-7 px-4 pb-4 pt-4 lg:pt-5">
      <BannerSlider />
      <TrustBar />
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="section-kicker"><Sparkles className="size-3" /> Parent favourites</span>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-plum-800 md:text-3xl">
              Popular right now
            </h2>
            <p className="mt-0.5 text-sm text-plum-400">Loved by parents this week</p>
          </div>
          <Link href="/shop" className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-plum-600 shadow-sm ring-1 ring-plum-100 transition-transform hover:translate-x-1 sm:flex">
            View all <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
        <ProductBrowser initialProducts={productCardPayloads(products)} initialTotal={total} defaultSort="popularity" />
      </section>
      <HomeSeoContent />
      <RecentlyViewed />
    </div>
  );
}
