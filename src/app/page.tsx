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
  title: "বাচ্চাদের খেলনা, বেবি ড্রেস ও Baby Toys, Kids Items in Bangladesh",
  description:
    "বাংলাদেশে বাচ্চাদের সেরা খেলনা (Baby Toys), পোশাক (Baby Clothing) ও প্রয়োজনীয় কিডস আইটেম কিনুন GeduShop থেকে। সাশ্রয়ী দাম ও সারা দেশে ক্যাশ অন ডেলিভারি।",
  keywords: [
    "বাচ্চাদের খেলনা",
    "babuder khelna",
    "baby toys",
    "kids toys bd",
    "baby cloth",
    "baby dress bd",
    "বাচ্চাদের জামাকাপড়",
    "baby shop bd",
    "educational toys bd",
    "gedushop",
    "গেদুশপ",
  ],
  alternates: { canonical: "/" },
};

async function PopularProducts() {
  // Do not publish an empty homepage when WordPress is temporarily down.
  // The build fetch already retries; if it still fails, keeping the current
  // production deployment is safer than replacing it with "No products".
  const { products, total } = await getProductsPaged({ perPage: 24, orderby: "popularity" });

  return <ProductBrowser initialProducts={productCardPayloads(products)} initialTotal={total} defaultSort="popularity" />;
}

export default function HomePage() {

  return (
    <div className="space-y-6 sm:space-y-7 px-3 sm:px-4 lg:px-3 pb-4 pt-3 sm:pt-4 lg:pt-3">
      <BannerSlider />
      <TrustBar />
      <section className="space-y-4">
        <div className="grain relative flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-plum-700 via-plum-600 to-coral-500 px-5 py-5 text-white sm:px-7 sm:py-6">
          <span aria-hidden className="absolute -right-10 -top-16 size-44 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="size-3" /> Parent favourites
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Popular right now
            </h2>
            <p className="mt-0.5 text-xs text-white/80 sm:text-sm">Loved by parents this week</p>
          </div>
          <Link
            href="/shop"
            className="relative hidden items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-plum-700 sm:flex"
          >
            View all <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
        <PopularProducts />
      </section>
      <HomeSeoContent />
      <RecentlyViewed />
    </div>
  );
}
