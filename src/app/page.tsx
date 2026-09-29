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
    <div className="space-y-6 sm:space-y-7 px-3 sm:px-4 pb-4 pt-3 sm:pt-4 lg:pt-5">
      <BannerSlider />
      <TrustBar />
      <section className="sm:fancy-surface sm:rounded-[1.75rem] sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="section-kicker"><Sparkles className="size-3" /> Parent favourites</span>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-plum-800 md:text-3xl">
              Popular right now
            </h2>
            <p className="mt-0.5 text-sm text-plum-400">Loved by parents this week</p>
          </div>
          <Link href="/shop" className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-plum-600 shadow-sm ring-1 ring-plum-100 transition-colors duration-200 hover:text-coral-600 hover:ring-coral-200 sm:flex">
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
