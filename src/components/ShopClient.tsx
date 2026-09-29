"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import type { StoreCategory, StoreProduct } from "@/lib/types";

interface Props {
  initialProducts: StoreProduct[];
  initialTotal: number;
  categories: StoreCategory[];
}

function ShopContent({
  initialProducts,
  initialTotal,
  categories,
  search,
  sale = false,
  sortParam,
  hasAdvanced = false,
}: Props & { search?: string; sale?: boolean; sortParam?: string | null; hasAdvanced?: boolean }) {
  const defaultSort =
    sortParam === "date" ||
    sortParam === "price_asc" ||
    sortParam === "price_desc" ||
    sortParam === "rating" ||
    sortParam === "discount" ||
    sortParam === "saving" ||
    sortParam === "title"
      ? sortParam
      : sortParam === "price"
        ? "price_asc"
        : search
          ? "relevance"
          : "popularity";
  const filtered = Boolean(search || sale || sortParam || hasAdvanced);
  const title = search
    ? `Results for “${search}”`
    : sale
      ? "Flash Sales"
      : sortParam === "date"
        ? "New Arrivals"
        : "Shop Baby Products & Kids Toys";

  return (
    <div className="space-y-4 px-3 sm:px-4 lg:px-3 pt-3 sm:pt-4 lg:pt-3">
      <div className="grain relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2a1f4e] via-[#6f3374] to-[#ee6154] px-5 py-5 text-white shadow-md shadow-plum-950/10 sm:px-7 sm:py-6">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-coral-400/20 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -left-10 -bottom-16 size-48 rounded-full bg-violet-400/15 blur-2xl" />
        <p className="relative text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70">Discover something lovely</p>
        <h1 className="relative mt-1 font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      </div>
      <ProductBrowser
        key={`${search ?? ""}|${sale ? "1" : ""}|${sortParam ?? ""}`}
        search={search}
        defaultSort={defaultSort}
        defaultOnSale={sale}
        categories={categories}
        initialProducts={filtered ? undefined : initialProducts}
        initialTotal={filtered ? undefined : initialTotal}
        paginationBase="/shop"
      />
    </div>
  );
}

function ShopRoute({ initialProducts, initialTotal, categories }: Props) {
  const params = useSearchParams();
  return (
    <ShopContent
      initialProducts={initialProducts}
      initialTotal={initialTotal}
      categories={categories}
      search={params.get("search") ?? undefined}
      sale={params.get("sale") === "1"}
      sortParam={params.get("sort")}
      hasAdvanced={["stock", "free_delivery", "rating", "age", "min_price", "max_price", "category"].some((key) => params.has(key))}
    />
  );
}

export default function ShopClient(props: Props) {
  // The static exporter suspends useSearchParams. This complete fallback is the
  // exported HTML, so crawlers and no-JS visitors receive the real first page.
  return (
    <Suspense fallback={<ShopContent {...props} />}>
      <ShopRoute {...props} />
    </Suspense>
  );
}
