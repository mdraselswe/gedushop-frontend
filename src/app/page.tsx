import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import BannerSlider from "@/components/BannerSlider";
import ProductBrowser from "@/components/ProductBrowser";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrustBar from "@/components/TrustBar";
import HomeSeoContent from "@/components/HomeSeoContent";
import { getProductsPaged } from "@/lib/wp";
import { productCardPayloads } from "@/lib/productCardPayload";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

export const metadata: Metadata = {
  title: "Baby Items, Toys, Baby Clothing & Kids Essentials Online",
  description:
    "Shop baby items, toys, baby clothing and kids essentials online in Bangladesh at GeduShop. Cash on delivery all over the country — genuine, quality-checked products at the best price.",
  alternates: { canonical: "/" },
};

async function PopularProducts() {
  // Do not publish an empty homepage when WordPress is temporarily down.
  // The build fetch already retries; if it still fails, keeping the current
  // production deployment is safer than replacing it with "No products".
  const { products, total } = await getProductsPaged({ perPage: 24, orderby: "popularity" });

  return <ProductBrowser initialProducts={productCardPayloads(products)} initialTotal={total} defaultSort="popularity" />;
}

function PopularProductsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading popular products">
      <div className="fancy-surface flex h-12 items-center justify-between rounded-xl p-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-plum-50" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-plum-50" />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[381px]:grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => <ProductCardSkeleton key={index} />)}
      </div>
    </div>
  );
}

export default function HomePage() {

  return (
    <div className="space-y-7 px-4 pb-4 pt-4 lg:pt-5">
      <BannerSlider />
      <TrustBar />
      <section className="fancy-surface rounded-[1.75rem] p-3 sm:p-5">
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
        <Suspense fallback={<PopularProductsSkeleton />}>
          <PopularProducts />
        </Suspense>
      </section>
      <HomeSeoContent />
      <RecentlyViewed />
    </div>
  );
}
